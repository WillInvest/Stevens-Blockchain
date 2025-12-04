// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AMM - Uniswap V2 Style Automated Market Maker
 * @dev Simple AMM for exchanging SDC and SBC tokens using constant product formula (x * y = k)
 */
contract AMM is ERC20, Ownable {
    using SafeERC20 for IERC20;

    // Token addresses
    IERC20 public token0; // SDC (Stevens Duck Coin)
    IERC20 public token1; // SBC (Stevens Banana Coin)

    // Reserves
    uint256 public reserve0;
    uint256 public reserve1;

    // Minimum liquidity (to prevent division by zero)
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    // Events
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint256 reserve0, uint256 reserve1);

    constructor(
        address _token0,
        address _token1
    ) ERC20("SDC-SBC LP Token", "SDC-SBC-LP") Ownable(msg.sender) {
        require(_token0 != address(0) && _token1 != address(0), "AMM: ZERO_ADDRESS");
        require(_token0 != _token1, "AMM: IDENTICAL_ADDRESSES");
        
        // Ensure token0 < token1 for consistency
        require(_token0 < _token1, "AMM: INVALID_TOKEN_ORDER");
        
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    /**
     * @dev Get current reserves
     */
    function getReserves() public view returns (uint256 _reserve0, uint256 _reserve1) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }

    /**
     * @dev Update reserves (internal)
     */
    function _update(uint256 balance0, uint256 balance1) private {
        reserve0 = balance0;
        reserve1 = balance1;
        emit Sync(reserve0, reserve1);
    }

    /**
     * @dev Add liquidity to the pool
     * @param amount0Desired Amount of token0 to add
     * @param amount1Desired Amount of token1 to add
     * @param amount0Min Minimum amount of token0 (slippage protection)
     * @param amount1Min Minimum amount of token1 (slippage protection)
     * @param to Address to receive LP tokens
     * @return liquidity Amount of LP tokens minted
     */
    function addLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min,
        address to
    ) external returns (uint256 liquidity) {
        require(to != address(0) && to != address(this), "AMM: INVALID_TO");
        
        (uint256 _reserve0, uint256 _reserve1) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        
        uint256 amount0;
        uint256 amount1;

        if (_reserve0 == 0 && _reserve1 == 0) {
            // First liquidity provision
            amount0 = amount0Desired;
            amount1 = amount1Desired;
        } else {
            // Calculate optimal amounts based on current ratio
            uint256 amount1Optimal = _quote(amount0Desired, _reserve0, _reserve1);
            if (amount1Optimal <= amount1Desired) {
                require(amount1Optimal >= amount1Min, "AMM: INSUFFICIENT_AMOUNT_1");
                amount0 = amount0Desired;
                amount1 = amount1Optimal;
            } else {
                uint256 amount0Optimal = _quote(amount1Desired, _reserve1, _reserve0);
                require(amount0Optimal <= amount0Desired, "AMM: INSUFFICIENT_AMOUNT_0");
                require(amount0Optimal >= amount0Min, "AMM: INSUFFICIENT_AMOUNT_0");
                amount0 = amount0Optimal;
                amount1 = amount1Desired;
            }
        }

        // Transfer tokens from user
        if (amount0 > 0) {
            token0.safeTransferFrom(msg.sender, address(this), amount0);
        }
        if (amount1 > 0) {
            token1.safeTransferFrom(msg.sender, address(this), amount1);
        }

        // Calculate liquidity to mint
        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));
        
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = _sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // Permanently lock minimum liquidity
        } else {
            liquidity = _min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }
        
        require(liquidity > 0, "AMM: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1);
    }

    /**
     * @dev Remove liquidity from the pool
     * @param liquidity Amount of LP tokens to burn
     * @param amount0Min Minimum amount of token0 (slippage protection)
     * @param amount1Min Minimum amount of token1 (slippage protection)
     * @param to Address to receive tokens
     * @return amount0 Amount of token0 returned
     * @return amount1 Amount of token1 returned
     */
    function removeLiquidity(
        uint256 liquidity,
        uint256 amount0Min,
        uint256 amount1Min,
        address to
    ) external returns (uint256 amount0, uint256 amount1) {
        require(to != address(0) && to != address(this), "AMM: INVALID_TO");
        
        uint256 _totalSupply = totalSupply();
        _burn(msg.sender, liquidity);

        (uint256 _reserve0, uint256 _reserve1) = getReserves();
        amount0 = (liquidity * _reserve0) / _totalSupply;
        amount1 = (liquidity * _reserve1) / _totalSupply;
        
        require(amount0 >= amount0Min, "AMM: INSUFFICIENT_AMOUNT_0");
        require(amount1 >= amount1Min, "AMM: INSUFFICIENT_AMOUNT_1");

        if (amount0 > 0) {
            token0.safeTransfer(to, amount0);
        }
        if (amount1 > 0) {
            token1.safeTransfer(to, amount1);
        }

        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        
        _update(balance0, balance1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     * @dev Swap tokens
     * @param amount0Out Amount of token0 to output (0 if swapping token1)
     * @param amount1Out Amount of token1 to output (0 if swapping token0)
     * @param to Address to receive output tokens
     * @param data Additional data (unused, for compatibility)
     */
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external {
        // Unused parameter - kept for interface compatibility
        data;
        
        require(amount0Out > 0 || amount1Out > 0, "AMM: INSUFFICIENT_OUTPUT_AMOUNT");
        require(to != address(0) && to != address(token0) && to != address(token1), "AMM: INVALID_TO");
        
        (uint256 _reserve0, uint256 _reserve1) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "AMM: INSUFFICIENT_LIQUIDITY");

        uint256 _amount0In;
        uint256 _amount1In;
        
        {
            // scope for token{0,1}, avoids stack too deep errors
            address _token0 = address(token0);
            address _token1 = address(token1);
            require(to != _token0 && to != _token1, "AMM: INVALID_TO");
            
            if (amount0Out > 0) {
                // Swapping token1 for token0
                token0.safeTransfer(to, amount0Out);
                uint256 token1Balance = IERC20(_token1).balanceOf(address(this));
                _amount1In = token1Balance - _reserve1;
            } else {
                // Swapping token0 for token1
                token1.safeTransfer(to, amount1Out);
                uint256 token0Balance = IERC20(_token0).balanceOf(address(this));
                _amount0In = token0Balance - _reserve0;
            }
        }
        
        uint256 _balance0 = IERC20(token0).balanceOf(address(this));
        uint256 _balance1 = IERC20(token1).balanceOf(address(this));

        uint256 amount0InAdjusted = _amount0In * 997; // 0.3% fee (no division needed, we divide by 1000*1000 later)
        uint256 amount1InAdjusted = _amount1In * 997; // 0.3% fee
        
        require(
            _balance0 * _balance1 >= (_reserve0 * 1000 + amount0InAdjusted) * (_reserve1 * 1000 + amount1InAdjusted) / (1000 * 1000),
            "AMM: K"
        );

        _update(_balance0, _balance1);
        emit Swap(msg.sender, _amount0In, _amount1In, amount0Out, amount1Out, to);
    }

    /**
     * @dev Get amount out for a given amount in (with fee)
     * @param amountIn Amount of input token
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountOut Amount of output token
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "AMM: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "AMM: INSUFFICIENT_LIQUIDITY");
        
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @dev Get amount in for a given amount out (with fee)
     * @param amountOut Amount of output token desired
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountIn Amount of input token needed
     */
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountIn) {
        require(amountOut > 0, "AMM: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "AMM: INSUFFICIENT_LIQUIDITY");
        
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1; // Round up
    }

    /**
     * @dev Quote function for calculating optimal amounts
     */
    function _quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) private pure returns (uint256 amountB) {
        require(amountA > 0, "AMM: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "AMM: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    /**
     * @dev Square root function (Babylonian method)
     */
    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /**
     * @dev Minimum of two numbers
     */
    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}

