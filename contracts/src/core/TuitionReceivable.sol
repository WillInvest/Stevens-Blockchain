// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../tokens/StevensDuckCoin.sol";

/**
 * @title TuitionReceivable
 * @dev Contract to track individual student tuition obligations and payments
 * Phase 1: Foundation - Simple payment tracking without securitization
 */
contract TuitionReceivable is Ownable {
    using SafeERC20 for IERC20;
    
    // Reference to StudentManagement contract
    address public studentManagement;
    
    // Reference to SDC token for payments
    StevensDuckCoin public sdcToken;
    
    // Tuition obligation structure
    struct TuitionObligation {
        uint256 obligationId;           // Unique ID for this obligation
        address studentWallet;          // Student's wallet address
        uint256 studentId;               // Student's ID
        uint256 totalAmount;            // Total tuition amount (in SDC wei)
        uint256 paidAmount;             // Amount paid so far
        uint256 dueDate;                // Unix timestamp when payment is due
        uint256 createdAt;              // Unix timestamp when obligation was created
        bool isPaid;                    // Whether obligation is fully paid
        bool isOverdue;                 // Whether payment is past due date
        string description;             // Description (e.g., "Fall 2024 Tuition")
    }
    
    // Mapping: obligationId => TuitionObligation
    mapping(uint256 => TuitionObligation) public obligations;
    
    // Mapping: studentWallet => obligationId[]
    mapping(address => uint256[]) public studentObligations;
    
    // Mapping: studentId => obligationId[]
    mapping(uint256 => uint256[]) public studentIdObligations;
    
    // Counter for unique obligation IDs
    uint256 private _obligationCounter;
    
    // Payment history
    struct Payment {
        uint256 obligationId;
        uint256 amount;
        uint256 timestamp;
        address payer;
    }
    
    // Mapping: obligationId => Payment[]
    mapping(uint256 => Payment[]) public paymentHistory;
    
    // Events
    event StudentManagementUpdated(address indexed oldAddress, address indexed newAddress);
    event SDCTokenUpdated(address indexed oldAddress, address indexed newAddress);
    event TuitionObligationCreated(
        uint256 indexed obligationId,
        address indexed studentWallet,
        uint256 indexed studentId,
        uint256 totalAmount,
        uint256 dueDate,
        string description
    );
    event TuitionObligationUpdated(
        uint256 indexed obligationId,
        uint256 newTotalAmount,
        uint256 newDueDate
    );
    event TuitionPaymentMade(
        uint256 indexed obligationId,
        address indexed studentWallet,
        uint256 amount,
        uint256 remainingBalance
    );
    event TuitionObligationPaid(uint256 indexed obligationId, address indexed studentWallet);
    event TuitionObligationMarkedOverdue(uint256 indexed obligationId, address indexed studentWallet);
    
    constructor(address _studentManagement, address _sdcToken) Ownable(msg.sender) {
        studentManagement = _studentManagement;
        sdcToken = StevensDuckCoin(_sdcToken);
        _obligationCounter = 1; // Start at 1
    }
    
    /**
     * @dev Set the StudentManagement contract address
     */
    function setStudentManagement(address _studentManagement) external onlyOwner {
        address oldAddress = studentManagement;
        studentManagement = _studentManagement;
        emit StudentManagementUpdated(oldAddress, _studentManagement);
    }
    
    /**
     * @dev Set the SDC token contract address
     */
    function setSDCToken(address _sdcToken) external onlyOwner {
        address oldAddress = address(sdcToken);
        sdcToken = StevensDuckCoin(_sdcToken);
        emit SDCTokenUpdated(oldAddress, _sdcToken);
    }
    
    /**
     * @dev Create a new tuition obligation for a student
     * @param studentWallet Student's wallet address
     * @param studentId Student's ID
     * @param totalAmount Total tuition amount in SDC wei
     * @param dueDate Unix timestamp when payment is due
     * @param description Description of the obligation
     * @return obligationId The ID of the created obligation
     */
    function createObligation(
        address studentWallet,
        uint256 studentId,
        uint256 totalAmount,
        uint256 dueDate,
        string memory description
    ) external onlyOwner returns (uint256) {
        require(studentWallet != address(0), "Invalid student wallet");
        require(totalAmount > 0, "Amount must be greater than 0");
        require(dueDate > block.timestamp, "Due date must be in the future");
        
        uint256 obligationId = _obligationCounter++;
        
        obligations[obligationId] = TuitionObligation({
            obligationId: obligationId,
            studentWallet: studentWallet,
            studentId: studentId,
            totalAmount: totalAmount,
            paidAmount: 0,
            dueDate: dueDate,
            createdAt: block.timestamp,
            isPaid: false,
            isOverdue: false,
            description: description
        });
        
        studentObligations[studentWallet].push(obligationId);
        studentIdObligations[studentId].push(obligationId);
        
        emit TuitionObligationCreated(
            obligationId,
            studentWallet,
            studentId,
            totalAmount,
            dueDate,
            description
        );
        
        return obligationId;
    }
    
    /**
     * @dev Update an existing tuition obligation (amount or due date)
     * @param obligationId The ID of the obligation to update
     * @param newTotalAmount New total amount (0 to keep unchanged)
     * @param newDueDate New due date (0 to keep unchanged)
     */
    function updateObligation(
        uint256 obligationId,
        uint256 newTotalAmount,
        uint256 newDueDate
    ) external onlyOwner {
        TuitionObligation storage obligation = obligations[obligationId];
        require(obligation.obligationId != 0, "Obligation does not exist");
        require(!obligation.isPaid, "Cannot update paid obligation");
        
        if (newTotalAmount > 0) {
            require(newTotalAmount >= obligation.paidAmount, "New amount must cover paid amount");
            obligation.totalAmount = newTotalAmount;
        }
        
        if (newDueDate > 0) {
            obligation.dueDate = newDueDate;
        }
        
        emit TuitionObligationUpdated(obligationId, obligation.totalAmount, obligation.dueDate);
    }
    
    /**
     * @dev Make a payment towards a tuition obligation using SDC
     * @param obligationId The ID of the obligation to pay
     * @param amount Amount to pay in SDC wei
     */
    function makePayment(uint256 obligationId, uint256 amount) external {
        TuitionObligation storage obligation = obligations[obligationId];
        require(obligation.obligationId != 0, "Obligation does not exist");
        require(!obligation.isPaid, "Obligation already paid");
        require(amount > 0, "Payment amount must be greater than 0");
        require(msg.sender == obligation.studentWallet, "Only student can pay their obligation");
        
        uint256 remainingBalance = obligation.totalAmount - obligation.paidAmount;
        require(amount <= remainingBalance, "Payment exceeds remaining balance");
        require(sdcToken.balanceOf(msg.sender) >= amount, "Insufficient SDC balance");
        require(sdcToken.allowance(msg.sender, address(this)) >= amount, "Insufficient SDC allowance");
        
        // Transfer SDC from student to this contract
        IERC20(address(sdcToken)).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update obligation
        obligation.paidAmount += amount;
        
        // Record payment
        paymentHistory[obligationId].push(Payment({
            obligationId: obligationId,
            amount: amount,
            timestamp: block.timestamp,
            payer: msg.sender
        }));
        
        // Check if fully paid
        if (obligation.paidAmount >= obligation.totalAmount) {
            obligation.isPaid = true;
            emit TuitionObligationPaid(obligationId, msg.sender);
        }
        
        uint256 newRemainingBalance = obligation.totalAmount - obligation.paidAmount;
        emit TuitionPaymentMade(obligationId, msg.sender, amount, newRemainingBalance);
    }
    
    /**
     * @dev Mark obligations as overdue (should be called periodically by owner or keeper)
     * @param obligationIds Array of obligation IDs to check
     */
    function markOverdue(uint256[] calldata obligationIds) external {
        uint256 currentTime = block.timestamp;
        
        for (uint256 i = 0; i < obligationIds.length; i++) {
            uint256 obligationId = obligationIds[i];
            TuitionObligation storage obligation = obligations[obligationId];
            
            if (obligation.obligationId != 0 && 
                !obligation.isPaid && 
                !obligation.isOverdue &&
                currentTime > obligation.dueDate) {
                obligation.isOverdue = true;
                emit TuitionObligationMarkedOverdue(obligationId, obligation.studentWallet);
            }
        }
    }
    
    /**
     * @dev Get obligation details
     * @param obligationId The ID of the obligation
     * @return obligation The obligation struct
     */
    function getObligation(uint256 obligationId) 
        external 
        view 
        returns (TuitionObligation memory) 
    {
        return obligations[obligationId];
    }
    
    /**
     * @dev Get all obligations for a student by wallet address
     * @param studentWallet Student's wallet address
     * @return obligationIds Array of obligation IDs
     * @return obligationList Array of obligation structs
     */
    function getStudentObligations(address studentWallet)
        external
        view
        returns (uint256[] memory obligationIds, TuitionObligation[] memory obligationList)
    {
        obligationIds = studentObligations[studentWallet];
        obligationList = new TuitionObligation[](obligationIds.length);
        
        for (uint256 i = 0; i < obligationIds.length; i++) {
            obligationList[i] = obligations[obligationIds[i]];
        }
        
        return (obligationIds, obligationList);
    }
    
    /**
     * @dev Get all obligations for a student by student ID
     * @param studentId Student's ID
     * @return obligationIds Array of obligation IDs
     * @return obligationList Array of obligation structs
     */
    function getStudentObligationsById(uint256 studentId)
        external
        view
        returns (uint256[] memory obligationIds, TuitionObligation[] memory obligationList)
    {
        obligationIds = studentIdObligations[studentId];
        obligationList = new TuitionObligation[](obligationIds.length);
        
        for (uint256 i = 0; i < obligationIds.length; i++) {
            obligationList[i] = obligations[obligationIds[i]];
        }
        
        return (obligationIds, obligationList);
    }
    
    /**
     * @dev Get payment history for an obligation
     * @param obligationId The ID of the obligation
     * @return payments Array of payment structs
     */
    function getPaymentHistory(uint256 obligationId)
        external
        view
        returns (Payment[] memory)
    {
        return paymentHistory[obligationId];
    }
    
    /**
     * @dev Get total outstanding balance for a student
     * @param studentWallet Student's wallet address
     * @return totalOutstanding Total unpaid amount across all obligations
     */
    function getTotalOutstanding(address studentWallet)
        external
        view
        returns (uint256 totalOutstanding)
    {
        uint256[] memory obligationIds = studentObligations[studentWallet];
        
        for (uint256 i = 0; i < obligationIds.length; i++) {
            TuitionObligation memory obligation = obligations[obligationIds[i]];
            if (!obligation.isPaid) {
                totalOutstanding += (obligation.totalAmount - obligation.paidAmount);
            }
        }
        
        return totalOutstanding;
    }
    
    /**
     * @dev Withdraw collected SDC payments (only owner)
     * @param to Address to send SDC to
     * @param amount Amount to withdraw
     */
    function withdrawSDC(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        require(sdcToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        IERC20(address(sdcToken)).safeTransfer(to, amount);
    }
    
    /**
     * @dev Get contract's SDC balance
     * @return balance Current SDC balance held by contract
     */
    function getContractBalance() external view returns (uint256 balance) {
        return sdcToken.balanceOf(address(this));
    }
}

