//SPDX-License-Identifier: MIT
/**********************************
/* Adaptation Author: Matteo Lucchi, <matteo.lucchi98@outlook.it
/**********************************
/* Original Author: Nick Mudge, <nick@perfectabstractions.com>, https://medium.com/@mudgen.
/**********************************/

pragma solidity ^0.8.11;
// Imports from OpenZeppelin standard
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
// From Nick Mudge work.
import "./SafeMath.sol";

interface ERC998ERC721TopDown {
    event ReceivedChild(address indexed _from, uint256 indexed _tokenId, address indexed _childContract, uint256 _childTokenId);
    event TransferChild(uint256 indexed tokenId, address indexed _to, address indexed _childContract, uint256 _childTokenId);

    function rootOwnerOf(uint256 _tokenId) external view returns (bytes32 rootOwner);
    function rootOwnerOfChild(address _childContract, uint256 _childTokenId) external view returns (bytes32 rootOwner);
    function ownerOfChild(address _childContract, uint256 _childTokenId) external view returns (bytes32 parentTokenOwner, uint256 parentTokenId);
    function getChild(address _from, uint256 _tokenId, address _childContract, uint256 _childTokenId) external;
}

interface ERC998ERC721TopDownEnumerable {
    function totalChildContracts(uint256 _tokenId) external view returns (uint256);
    function childContractByIndex(uint256 _tokenId, uint256 _index) external view returns (address childContract);
    function totalChildTokens(uint256 _tokenId, address _childContract) external view returns (uint256);
    function getChildTokensIndexes(uint256 _tokenId, address _childContract) external view returns (uint256[] memory);
    function childTokenByIndex(uint256 _tokenId, address _childContract, uint256 _index) external view returns (uint256 childTokenId);
}

contract ERC998TopDown is ERC721, ERC998ERC721TopDown, ERC998ERC721TopDownEnumerable
{
    // return this.rootOwnerOf.selector ^ this.rootOwnerOfChild.selector ^
    //   this.tokenOwnerOf.selector ^ this.ownerOfChild.selector;
    bytes32 constant ERC998_MAGIC_VALUE = "0xcd740db5";

    uint256 public tokenCount = 0;

    // structure that represent the traceability of previous owners
    struct Ownership {
        address ownerAddress;
        uint256 purchaseTime;
        uint256 purchasePrice;
    }

    //tokenId => ownership
    mapping(uint256 => Ownership[]) internal tokenIdToOwnerships;

    // tokenId => token owner
    mapping(uint256 => address) internal tokenIdToTokenOwner;

    // root token owner address => (tokenId => approved address)
    mapping(address => mapping(uint256 => address)) internal rootOwnerAndTokenIdToApprovedAddress;

    // token owner address => token count
    mapping(address => uint256) internal tokenOwnerToTokenCount;

    // token owner => (operator address => bool)
    mapping(address => mapping(address => bool)) internal tokenOwnerToOperators;

    // Mapping for token URIs
    mapping(uint256 => string) internal _tokenURIs;

    //mapping of sold tokens Ids
    mapping (uint256 => bool) public soldTokensId;

    //token id => price
    mapping(uint256 => uint256) internal tokenPrices; 

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

    // wrapper on minting new 721 composable
    function mint(string memory _tokenURI, uint256 price) public returns (uint256) {
        address _to = msg.sender;
        tokenCount++;

        uint256 tokenCount_ = tokenCount;
        tokenIdToTokenOwner[tokenCount_] = _to;
        tokenOwnerToTokenCount[_to]++;
        _setTokenURI(tokenCount_, _tokenURI);
        tokenPrices[tokenCount] = price;

        // Add ownership of the token
        uint timestamp = block.timestamp;
        //Math.floor(new Date().getTime() / 1000);
        tokenIdToOwnerships[tokenCount_].push(Ownership(_to, timestamp, price));

        return tokenCount_;
    }

     /**
     * @dev Returns the Uniform Resource Identifier (URI) for `tokenId` token.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(tokenIdToTokenOwner[tokenId] != address(0), "ERC998: URI query for nonexistent token"); //the token must exists

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return ""; //return empty string if the token Uri is not set
    }

    
    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(tokenIdToTokenOwner[tokenId] != address(0), "ERC998: URI query for nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    //from zepellin ERC721Receiver.sol
    //old version
    bytes4 constant ERC721_RECEIVED_OLD = 0xf0b9e5ba;
    //new version
    bytes4 constant ERC721_RECEIVED_NEW = 0x150b7a02;

    ////////////////////////////////////////////////////////
    // ERC721 implementation
    ////////////////////////////////////////////////////////

    function isContract(address _addr) internal view returns (bool) {
        uint256 size;
        assembly {size := extcodesize(_addr)}
        return size > 0;
    }

    function rootOwnerOf(uint256 _tokenId) public view returns (bytes32 rootOwner) {
        return rootOwnerOfChild(address(0), _tokenId);
    }

    /**
     * @dev Returns the owner at the top of the tree of composables
     *      Use Cases handled:
     *      Case 1: Token owner is this contract and token.
     *      Case 2: Token owner is other top-down composable
     *      Case 3: Token owner is other contract
     *      Case 4: Token owner is user
     */
    function rootOwnerOfChild(address _childContract, uint256 _childTokenId) public view returns (bytes32 rootOwner) {
        address rootOwnerAddress;
        if (_childContract != address(0)) {
            (rootOwnerAddress, _childTokenId) = _ownerOfChild(_childContract, _childTokenId);
        }
        else {
            rootOwnerAddress = tokenIdToTokenOwner[_childTokenId];
        }
        // Case 1: Token owner is this contract and token.
        while (rootOwnerAddress == address(this)) {
            (rootOwnerAddress, _childTokenId) = _ownerOfChild(rootOwnerAddress, _childTokenId);
        }

        bool callSuccess;
        bytes memory pidgeon;
        
        // 0xed81cdda == rootOwnerOfChild(address,uint256)
        pidgeon = abi.encodeWithSelector(0xed81cdda, address(this), _childTokenId);
        assembly {
            callSuccess := staticcall(gas(), rootOwnerAddress, add(pidgeon, 0x20), mload(pidgeon), pidgeon, 0x20)
            if callSuccess {
                rootOwner := mload(pidgeon)
            }
        }
        if(callSuccess == true && rootOwner >> 224 == ERC998_MAGIC_VALUE) {
            // Case 2: Token owner is other top-down composable
            return rootOwner;
        }
        else {
            // Case 3: Token owner is other contract
            // Or
            // Case 4: Token owner is user
            return ERC998_MAGIC_VALUE << 224 | bytes32(uint256(uint160(rootOwnerAddress)));
        }
    }

    /**
     * @dev Returns the owner at the top of the tree of composables.
     *
     * Requirements:
     *
     * - `tokenOwner` of `tokenId` must exist.
     */
    function ownerOf(uint256 _tokenId) public override view returns (address tokenOwner) {
        tokenOwner = tokenIdToTokenOwner[_tokenId];
        require(tokenOwner != address(0));
        return tokenOwner;
    }

    function balanceOf(address _tokenOwner) public override view returns (uint256) {
        require(_tokenOwner != address(0));
        return tokenOwnerToTokenCount[_tokenOwner];
    }


    function approve(address _approved, uint256 _tokenId) public override {
        address rootOwner = address(uint160(uint256(rootOwnerOf(_tokenId))));
        require(rootOwner == msg.sender || tokenOwnerToOperators[rootOwner][msg.sender]);
        rootOwnerAndTokenIdToApprovedAddress[rootOwner][_tokenId] = _approved;
        emit Approval(rootOwner, _approved, _tokenId);
    }

    function getApproved(uint256 _tokenId) public override view returns (address)  {
        address rootOwner = address(uint160(uint256(rootOwnerOf(_tokenId))));
        return rootOwnerAndTokenIdToApprovedAddress[rootOwner][_tokenId];
    }

    function setApprovalForAll(address _operator, bool _approved) public override {
        require(_operator != address(0));
        tokenOwnerToOperators[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function isApprovedForAll(address _owner, address _operator) public override view returns (bool)  {
        require(_owner != address(0));
        require(_operator != address(0));
        return tokenOwnerToOperators[_owner][_operator];
    }


    function _transferFrom(address _from, address _to, uint256 _tokenId) private {
        require(_from != address(0));
        require(tokenIdToTokenOwner[_tokenId] == _from);
        require(_to != address(0));

        if(msg.sender != _from) {
            bytes32 rootOwner;
            bool callSuccess;
            // 0xed81cdda == rootOwnerOfChild(address,uint256)
            bytes memory pidgeon = abi.encodeWithSelector(0xed81cdda, address(this), _tokenId);
            assembly {
                callSuccess := staticcall(gas(), _from, add(pidgeon, 0x20), mload(pidgeon), pidgeon, 0x20)
                if callSuccess {
                    rootOwner := mload(pidgeon)
                }
            }
            if(callSuccess == true) {
                require(rootOwner >> 224 != ERC998_MAGIC_VALUE, "Token is child of other top down composable");
            }
            //SCOMMENTARE
            //require(tokenOwnerToOperators[_from][msg.sender] ||
            //rootOwnerAndTokenIdToApprovedAddress[_from][_tokenId] == msg.sender);
        }

        // clear approval
        if (rootOwnerAndTokenIdToApprovedAddress[_from][_tokenId] != address(0)) {
            delete rootOwnerAndTokenIdToApprovedAddress[_from][_tokenId];
            emit Approval(_from, address(0), _tokenId);
        }

        // remove and transfer token
        if (_from != _to) {
            assert(tokenOwnerToTokenCount[_from] > 0);
            tokenOwnerToTokenCount[_from]--;
            tokenIdToTokenOwner[_tokenId] = _to;
            tokenOwnerToTokenCount[_to]++;
        }
        emit Transfer(_from, _to, _tokenId);

    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public override {
        _transferFrom(_from, _to, _tokenId);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public override {
        _transferFrom(_from, _to, _tokenId);
        if (isContract(_to)) {
            bytes4 retval = IERC721Receiver(_to).onERC721Received(msg.sender, _from, _tokenId, "");
            require(retval == ERC721_RECEIVED_OLD);
        }
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public override {
        _transferFrom(_from, _to, _tokenId);
        if (isContract(_to)) {
            bytes4 retval = IERC721Receiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data);
            require(retval == ERC721_RECEIVED_OLD);
        }
    }

    //function to buy the token
    function buyToken(uint256 _tokenId) payable public{
        address _to = msg.sender;

        //require that the token is not already sold
        require(soldTokensId[_tokenId] == false, "Token is already sold");

        //require amount of ether
        require(msg.value > tokenPrices[_tokenId], "Not enough ether send");

        require(_to != tokenIdToTokenOwner[_tokenId], "The owner already own the token");

        address payable oldOwner = payable(tokenIdToTokenOwner[_tokenId]);

        safeTransferFrom(tokenIdToTokenOwner[_tokenId], _to, _tokenId);

        oldOwner.transfer(msg.value);

        //set token as sold
        soldTokensId[_tokenId] = true;

        //add new ownership for the token
        uint timestamp = block.timestamp;
        //Math.floor(new Date().getTime() / 1000);
        tokenIdToOwnerships[_tokenId].push(Ownership(_to, timestamp, tokenPrices[_tokenId]));
    }

    //function to know if the token is already sold
    function isTokenSold(uint256 _tokenId) external view returns (bool){
        return soldTokensId[_tokenId];
    }

    //functions to get count of Ownerships, needed because Solidity doesn't support returning an array of structs yet
    function getOwnershipCount(uint256 _tokenId) external view returns (uint) {
        return tokenIdToOwnerships[_tokenId].length;
    }

    function getOwnershipsList(uint256 _tokenId, uint index) external view returns (address, uint256, uint256) {
        Ownership storage own = tokenIdToOwnerships[_tokenId][index];

        return (own.ownerAddress, own.purchaseTime, own.purchasePrice);
    }

    //function to buy the token
    function buyTokenRequest(uint256 _tokenId, address _customer) payable public{

        //require that the token is not already sold
        require(soldTokensId[_tokenId] == false, "Token is already sold");

        //require amount of ether
        require(msg.value == tokenPrices[_tokenId], "Not enough ether send");

        safeTransferFrom(tokenIdToTokenOwner[_tokenId], _customer, _tokenId);

        //set token as sold
        soldTokensId[_tokenId] = true;

        //add new ownership for the token
        uint timestamp = block.timestamp;
        //Math.floor(new Date().getTime() / 1000);
        tokenIdToOwnerships[_tokenId].push(Ownership(_customer, timestamp, tokenPrices[_tokenId]));
    }

    ////////////////////////////////////////////////////////
    // ERC998ERC721 and ERC998ERC721Enumerable implementation
    ////////////////////////////////////////////////////////

    // tokenId => child contract
    mapping(uint256 => address[]) private childContracts;

    // tokenId => (child address => contract index+1)
    mapping(uint256 => mapping(address => uint256)) private childContractIndex;

    // tokenId => (child address => array of child tokens)
    mapping(uint256 => mapping(address => uint256[])) private childTokens;

    // tokenId => (child address => (child token => child index+1)
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) private childTokenIndex;

    // child address => childId => tokenId
    mapping(address => mapping(uint256 => uint256)) internal childTokenOwner;

    // this contract has to be approved first in _childContract
    function getChild(address _from, uint256 _tokenId, address _childContract, uint256 _childTokenId) external {
        receiveChild(_from, _tokenId, _childContract, _childTokenId);
        require(_from == msg.sender ||
        ERC721(_childContract).isApprovedForAll(_from, msg.sender) ||
        ERC721(_childContract).getApproved(_childTokenId) == msg.sender);
        ERC721(_childContract).transferFrom(_from, address(this), _childTokenId);

    }

    function onERC721Received(address _operator, address _from, uint256 _childTokenId, bytes calldata _data) external returns (bytes4) {
        require(_data.length > 0, "_data must contain the uint256 tokenId to transfer the child token to.");
        // convert up to 32 bytes of_data to uint256, owner nft tokenId passed as uint in bytes
        uint256 tokenId;
        assembly {tokenId := calldataload(164)}
        if (_data.length < 32) {
            tokenId = tokenId >> 256 - _data.length * 8;
        }
        receiveChild(_from, tokenId, msg.sender, _childTokenId);
        require(ERC721(msg.sender).ownerOf(_childTokenId) != address(0), "Child token not owned.");
        return ERC721_RECEIVED_NEW;
    }

    function receiveChild(address _from, uint256 _tokenId, address _childContract, uint256 _childTokenId) private {
        require(tokenIdToTokenOwner[_tokenId] != address(0), "_tokenId does not exist.");
        require(childTokenIndex[_tokenId][_childContract][_childTokenId] == 0, "Cannot receive child token because it has already been received.");
        uint256 childTokensLength = childTokens[_tokenId][_childContract].length;
        if (childTokensLength == 0) {
            childContractIndex[_tokenId][_childContract] = childContracts[_tokenId].length;
            childContracts[_tokenId].push(_childContract);
        }
        childTokens[_tokenId][_childContract].push(_childTokenId);
        childTokenIndex[_tokenId][_childContract][_childTokenId] = childTokensLength + 1;
        childTokenOwner[_childContract][_childTokenId] = _tokenId;
        emit ReceivedChild(_from, _tokenId, _childContract, _childTokenId);
    }

    function _ownerOfChild(address _childContract, uint256 _childTokenId) internal view returns (address parentTokenOwner, uint256 parentTokenId) {
        parentTokenId = childTokenOwner[_childContract][_childTokenId];
        require(parentTokenId > 0 || childTokenIndex[parentTokenId][_childContract][_childTokenId] > 0);
        return (tokenIdToTokenOwner[parentTokenId], parentTokenId);
    }

    function ownerOfChild(address _childContract, uint256 _childTokenId) external view returns (bytes32 parentTokenOwner, uint256 parentTokenId) {
        parentTokenId = childTokenOwner[_childContract][_childTokenId];
        require(parentTokenId > 0 || childTokenIndex[parentTokenId][_childContract][_childTokenId] > 0);
        return (ERC998_MAGIC_VALUE << 224 | bytes32(uint256(uint160(tokenIdToTokenOwner[parentTokenId]))), parentTokenId);
    }

    function childExists(address _childContract, uint256 _childTokenId) external view returns (bool) {
        uint256 tokenId = childTokenOwner[_childContract][_childTokenId];
        return childTokenIndex[tokenId][_childContract][_childTokenId] != 0;
    }

    function totalChildContracts(uint256 _tokenId) external view returns (uint256) {
        return childContracts[_tokenId].length;
    }

    function childContractByIndex(uint256 _tokenId, uint256 _index) external view returns (address childContract) {
        require(_index < childContracts[_tokenId].length, "Contract address does not exist for this token and index.");
        return childContracts[_tokenId][_index];
    }

    function totalChildTokens(uint256 _tokenId, address _childContract) external view returns (uint256) {
        return childTokens[_tokenId][_childContract].length;
    }

    function getChildTokensIndexes(uint256 _tokenId, address _childContract) external view returns (uint256[] memory) {
        return childTokens[_tokenId][_childContract];
    }

    function childTokenByIndex(uint256 _tokenId, address _childContract, uint256 _index) external view returns (uint256 childTokenId) {
        require(_index < childTokens[_tokenId][_childContract].length, "Token does not own a child token at contract address and index.");
        return childTokens[_tokenId][_childContract][_index];
    }
}