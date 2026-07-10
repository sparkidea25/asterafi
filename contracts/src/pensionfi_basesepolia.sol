// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract PensionMinimal {
    address public constant CAPITAL = 0x80CC64698B305499eE3827BE8974ae47a2B19803;
    address public vaultWallet = 0xf1Ed7c5223c01ad7f5B3dFcc19AB005CA24f8A9b;
    // 0xd806A01E295386ef7a7Cea0B9DA037B242622743;

    uint256 public planCount;

    struct Plan {
        address beneficiary;
        uint256 monthlyAmount;
        uint256 totalMonths;
        uint256 monthsPaid;
        uint256 startTime;
        bool active;
    }

    mapping(uint256 => Plan) public plans;

    event PlanCreated(uint256 planId, address beneficiary, uint256 monthlyAmount, uint256 totalMonths);
    event PaymentExecuted(uint256 planId, uint256 month, uint256 amount);
    event PaymentFailed(uint256 planId, uint256 month, uint256 amount);

    uint256 constant MONTH = 30 days;

    // --- Crear plan ---
    function createPlan(address beneficiary, uint256 monthlyAmount, uint256 totalMonths) external returns (uint256) {
        require(beneficiary != address(0), "BAD_BEN");
        require(monthlyAmount > 0 && totalMonths > 0, "BAD_PARAMS");

        uint256 totalDeposit = monthlyAmount * totalMonths;
        require(IERC20(CAPITAL).transferFrom(msg.sender, vaultWallet, totalDeposit), "TRANSFER_FAIL");

        planCount++;
        plans[planCount] = Plan({
            beneficiary: beneficiary,
            monthlyAmount: monthlyAmount,
            totalMonths: totalMonths,
            monthsPaid: 0,
            startTime: block.timestamp,
            active: true
        });

        emit PlanCreated(planCount, beneficiary, monthlyAmount, totalMonths);
        return planCount;
    }

    // --- Procesar pago de un plan ---
    function processPayment(uint256 planId) public {
        Plan storage p = plans[planId];
        require(p.active, "INACTIVE_PLAN");
        require(p.monthsPaid < p.totalMonths, "ALL_PAID");

        uint256 dueTime = p.startTime + (p.monthsPaid + 1) * MONTH;
        require(block.timestamp >= dueTime, "TOO_EARLY");

        uint256 allowance = IERC20(CAPITAL).allowance(vaultWallet, address(this));
        uint256 balance = IERC20(CAPITAL).balanceOf(vaultWallet);

        if (allowance < p.monthlyAmount || balance < p.monthlyAmount) {
            emit PaymentFailed(planId, p.monthsPaid + 1, p.monthlyAmount);
            return;
        }

        require(IERC20(CAPITAL).transferFrom(vaultWallet, p.beneficiary, p.monthlyAmount), "PAY_FAIL");

        p.monthsPaid++;
        emit PaymentExecuted(planId, p.monthsPaid, p.monthlyAmount);

        if (p.monthsPaid == p.totalMonths) p.active = false;
    }

    // --- Get plan details ---
    function getPlan(uint256 planId)
        external
        view
        returns (
            address beneficiary,
            uint256 monthlyAmount,
            uint256 totalMonths,
            uint256 monthsPaid,
            uint256 startTime,
            bool active
        )
    {
        Plan storage p = plans[planId];
        require(p.beneficiary != address(0), "PLAN_NOT_FOUND");

        return (
            p.beneficiary,
            p.monthlyAmount,
            p.totalMonths,
            p.monthsPaid,
            p.startTime,
            p.active
        );
    }

    // --- Chainlink Automation ---
    function checkUpkeep(uint256 planId) external view returns (bool) {
        Plan storage p = plans[planId];
        if (!p.active) return false;
        if (p.monthsPaid >= p.totalMonths) return false;
        uint256 dueTime = p.startTime + (p.monthsPaid + 1) * MONTH;
        return block.timestamp >= dueTime;
    }

    function performUpkeep(uint256 planId) external {
        processPayment(planId);
    }
}
