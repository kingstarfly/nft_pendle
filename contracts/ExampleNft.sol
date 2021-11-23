pragma solidity ^0.8.0;

// import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
// import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Address.sol';


contract ExampleNft is ERC721URIStorage {
    using Counters for Counters.Counter;

    // Declaring the variables
    address public owner;
    Counters.Counter private _tokenIds;
    // ERC721 internal _pendlePartnerNftToken;
    string public pendlePartnerBaseUri;

    // map user addresses to the NFT Token IDs they own
    mapping(address=>uint256[]) public addressToTokenIds;

    // map Token IDs to tier 
    mapping(uint256=>uint256) public tokenIDToTier;

    // Constructor
    constructor(string memory _pendlePartnerBaseUri) ERC721('ExampleNft', 'ET') {
        // _pendlePartnerNftToken = ERC721(_pendlePartnerNftAddress);
        pendlePartnerBaseUri = _pendlePartnerBaseUri;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not owner');
        _;
    }

    function setBaseUri(string memory newBaseUri) public onlyOwner {
        pendlePartnerBaseUri = newBaseUri;
    }

    function mintTokens(address user, uint256 qty, uint256 tier)
        public
    {
        for (uint256 i = 0; i < qty; i++) {
            _tokenIds.increment();
        
            uint256 newItemId = _tokenIds.current();
            // _mint(user, newItemId);
            // _setTokenURI(newItemId, _concatenate(pendlePartnerBaseUri, _uint2str(tier)));   
            addressToTokenIds[user].push(newItemId);
            tokenIDToTier[newItemId] = tier;
        }
    }

    function getUserNftTierCounts(address user) public view returns (uint256[] memory) {
        uint256[] memory tierCounts = new uint256[](3);

        // check if the user exists in the mapping at the moment. If not, return default array
        if (addressToTokenIds[user].length == 0) {
            for (uint256 i=0; i < tierCounts.length; i++) {
                tierCounts[i] = 0;
            }
            // tierCounts = [0,0,0];
            return tierCounts;
        }
        
        uint256[] storage userTokenIds = addressToTokenIds[user];

        for (uint256 i=0; i < userTokenIds.length; i++) {
            uint256 curTokenTier = tokenIDToTier[userTokenIds[i]];
            tierCounts[curTokenTier - 1]++;
        }

        return tierCounts; // Return [qty1, qty2, qty3]
    }

    /*
        =================== HELPER FUNCTIONS ===================
    */
    // Helper function to convert uint to string 
    function _uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return '0';
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    // Helper function to concat base URI and tier number
    function _concatenate(string storage a, string memory b) internal pure returns(string memory) {
        return string(abi.encodePacked(a,b));
    }
    /*
        =================== END OF HELPER FUNCTIONS =================
    */
    
}