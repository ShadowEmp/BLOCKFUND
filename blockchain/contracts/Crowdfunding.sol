// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Crowdfunding
 * @notice Decentralized crowdfunding platform on Polygon Amoy
 */
contract Crowdfunding {
    // ─── Structs ───────────────────────────────────────────
    struct Campaign {
        uint256 id;
        address payable creator;
        string title;
        string description;
        uint256 goal;        // in wei
        uint256 deadline;    // unix timestamp
        uint256 amountRaised;
        string ipfsHash;     // Pinata CID for image/metadata
        bool withdrawn;
        bool exists;
    }

    // ─── State ─────────────────────────────────────────────
    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions; // campaignId => contributor => amount

    // ─── Events ─────────────────────────────────────────────
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline
    );
    event FundReceived(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );
    event Withdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event Refunded(uint256 indexed campaignId, address indexed contributor, uint256 amount);

    // ─── Modifiers ──────────────────────────────────────────
    modifier campaignExists(uint256 _id) {
        require(campaigns[_id].exists, "Campaign does not exist");
        _;
    }

    modifier onlyCreator(uint256 _id) {
        require(msg.sender == campaigns[_id].creator, "Not campaign creator");
        _;
    }

    modifier deadlinePassed(uint256 _id) {
        require(block.timestamp > campaigns[_id].deadline, "Deadline not reached yet");
        _;
    }

    // ─── Functions ──────────────────────────────────────────

    /**
     * @notice Create a new crowdfunding campaign
     * @param _title Campaign title
     * @param _description Campaign description
     * @param _goal Funding goal in wei
     * @param _deadline Unix timestamp of campaign deadline
     * @param _ipfsHash Pinata CID of campaign image/metadata
     */
    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _goal,
        uint256 _deadline,
        string calldata _ipfsHash
    ) external returns (uint256) {
        require(_goal > 0, "Goal must be greater than zero");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(_title).length > 0, "Title cannot be empty");

        campaignCount++;
        campaigns[campaignCount] = Campaign({
            id: campaignCount,
            creator: payable(msg.sender),
            title: _title,
            description: _description,
            goal: _goal,
            deadline: _deadline,
            amountRaised: 0,
            ipfsHash: _ipfsHash,
            withdrawn: false,
            exists: true
        });

        emit CampaignCreated(campaignCount, msg.sender, _title, _goal, _deadline);
        return campaignCount;
    }

    /**
     * @notice Contribute MATIC to a campaign
     * @param _campaignId ID of the campaign to fund
     */
    function contribute(uint256 _campaignId)
        external
        payable
        campaignExists(_campaignId)
    {
        Campaign storage c = campaigns[_campaignId];
        require(block.timestamp < c.deadline, "Campaign has ended");
        require(msg.value > 0, "Contribution must be greater than zero");
        require(!c.withdrawn, "Funds already withdrawn");

        c.amountRaised += msg.value;
        contributions[_campaignId][msg.sender] += msg.value;

        emit FundReceived(_campaignId, msg.sender, msg.value);
    }

    /**
     * @notice Withdraw funds if the goal is met after deadline
     * @param _campaignId ID of the campaign
     */
    function withdrawFunds(uint256 _campaignId)
        external
        campaignExists(_campaignId)
        onlyCreator(_campaignId)
        deadlinePassed(_campaignId)
    {
        Campaign storage c = campaigns[_campaignId];
        require(c.amountRaised >= c.goal, "Funding goal not reached");
        require(!c.withdrawn, "Already withdrawn");

        c.withdrawn = true;
        uint256 amount = c.amountRaised;
        c.creator.transfer(amount);

        emit Withdrawn(_campaignId, msg.sender, amount);
    }

    /**
     * @notice Refund contributor if goal not met after deadline
     * @param _campaignId ID of the campaign
     */
    function refund(uint256 _campaignId)
        external
        campaignExists(_campaignId)
        deadlinePassed(_campaignId)
    {
        Campaign storage c = campaigns[_campaignId];
        require(c.amountRaised < c.goal, "Goal was reached, no refund");
        require(!c.withdrawn, "Funds already withdrawn");

        uint256 contributed = contributions[_campaignId][msg.sender];
        require(contributed > 0, "No contribution to refund");

        contributions[_campaignId][msg.sender] = 0;
        payable(msg.sender).transfer(contributed);

        emit Refunded(_campaignId, msg.sender, contributed);
    }

    // ─── View Functions ─────────────────────────────────────

    /**
     * @notice Get full campaign details
     */
    function getCampaign(uint256 _campaignId)
        external
        view
        campaignExists(_campaignId)
        returns (
            uint256 id,
            address creator,
            string memory title,
            string memory description,
            uint256 goal,
            uint256 deadline,
            uint256 amountRaised,
            string memory ipfsHash,
            bool withdrawn
        )
    {
        Campaign storage c = campaigns[_campaignId];
        return (
            c.id,
            c.creator,
            c.title,
            c.description,
            c.goal,
            c.deadline,
            c.amountRaised,
            c.ipfsHash,
            c.withdrawn
        );
    }

    /**
     * @notice Check if a campaign met its funding goal
     */
    function isGoalMet(uint256 _campaignId)
        external
        view
        campaignExists(_campaignId)
        returns (bool)
    {
        Campaign storage c = campaigns[_campaignId];
        return c.amountRaised >= c.goal;
    }

    /**
     * @notice Get a contributor's total contribution to a campaign
     */
    function getContribution(uint256 _campaignId, address _contributor)
        external
        view
        returns (uint256)
    {
        return contributions[_campaignId][_contributor];
    }
}
