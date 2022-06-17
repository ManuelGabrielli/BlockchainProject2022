// contracts
const ComposableTopDown = artifacts.require("./ERC998TopDown.sol");
const SampleNFT = artifacts.require("./SampleNFT.sol");

// tools for overloaded function calls
const web3Utils = require('web3-utils');


/**************************************
* Tests
**************************************/

contract('ComposableTopDown', function(accounts) {

  let composable, sampleNFT, alice = accounts[0], bob = accounts[1], marc = accounts[2];

  /**************************************
  * NOTE
  *
  * Transferring composables requires a bytes of bytes32 in hex
  * to specify the receiving token index in the composable
  *
  * The following creates bytes of length 32 representing 1, 2 and 3
  **************************************/
  const bytes1 = web3Utils.padLeft(web3Utils.toHex(1), 32);
  const uriComposable = 'https://ipfs.infura.io/ipfs/QmZfD7GV4yZh96nZNeth1ayfPQ1M3yNwWAuxcjEnH3yfJy';
  const uriNFT = 'https://ipfs.infura.io/ipfs/QmZfD7GV4yZh96nZNeth1ayfPQ1M3yNwWAuxcjEnH3yfJy';
  const priceComposableOne = 10;

  it('should be deployed, Composable', async () => {

    composable = await  ComposableTopDown.deployed();

    assert(composable !== undefined, 'Composable was not deployed');
  });

  it('should be deployed, SampleNFT', async () => {
    sampleNFT = await SampleNFT.deployed();
    assert(sampleNFT !== undefined, 'SampleNFT was not deployed');
  });

  it('should mint a 721 token, Composable', async () => {
    const tokenId = await composable.mint.call(uriComposable, priceComposableOne, {from: alice});
    assert.equal(tokenId, 1, 'Composable 721 token was not created or has wrong tokenId');
    const tx = await composable.mint(uriComposable, priceComposableOne, {from: alice});
  });

  it('should mint a 721 token, SampleNFT', async () => {
    const tokenId = await sampleNFT.mint721.call(uriNFT, {from: alice});
    assert.equal(tokenId, 1, 'SampleNFT 721 token was not created or has wrong tokenId');
    const tx = await sampleNFT.mint721(uriNFT, {from: alice});
  });

  /*   GET URIS FROM CONTRACTS   */
  it('should get right URI from Composable', async () => {
    const uri = await composable.tokenURI.call(1);
    assert.equal(uri, uriComposable, 'did not receive the right uri for composable');
  });

  it('should get right URI from Composable', async () => {
    const uri = await sampleNFT.tokenURI.call(1);
    assert.equal(uri, uriNFT, 'did not receive the right uri for composable');
  });

  /*   TRANSFER SINGLE TOKEN   */
  it('should safeTransferFrom SampleNFT to Composable', async () => {
    const tx = await SampleNFT.deployed().then(function(instance) {
      nft = instance;

      return nft.methods['safeTransferFrom(address,address,uint256,bytes)'](alice, composable.address, 1, bytes1, { from: alice, gas: 500000 });
    });
    
    assert(tx != undefined, 'no tx using safeTransferFrom');
  });

  it('should get owning token of Composable', async () => {
    const result = await composable.ownerOfChild.call(sampleNFT.address, 1);
    assert.equal(result[1], 1, 'composable parent not found');
  });

  it('should own sampleNFT, Composable', async () => {
    const owned = await composable.childExists.call(sampleNFT.address, 1);
    assert(owned, 'composable does not own sampleNFT');
  });

  it('should have 1 child contract address sampleNFT', async () => {
    const contracts = await composable.totalChildContracts.call(1);
    const contract = await composable.childContractByIndex.call(1, 0);
    const tokenId = await composable.childTokenByIndex.call(1,sampleNFT.address,0);

    assert.equal(tokenId, 1, 'call to composable.childTokenByIndex failed or was wrong.');

    assert(contracts.toNumber() === 1 && contract === SampleNFT.address, 'composable does not have the right childs contract');
  });

  it('should mint a 721 token and transfer to Composable, SampleNFT', async () => {
    const tokenId = await sampleNFT.mint721.call(uriNFT, {from: bob});
    assert.equal(tokenId, 2, 'SampleNFT 721 token was not created or has wrong tokenId');
    const tx = await sampleNFT.mint721(uriNFT, {from: bob});

    //transfer
    const tt = await SampleNFT.deployed().then(function(instance) {
      nft = instance;

      return nft.methods['safeTransferFrom(address,address,uint256,bytes)'](bob, composable.address, 2, bytes1, { from: bob, gas: 500000 });
    });
    
    assert(tt != undefined, 'no tx using safeTransferFrom');
  });

  it('should have 2 child tokens for Contract SampleNFT, Composable', async () => {
    const num = await composable.totalChildTokens.call(1, sampleNFT.address);
    
    assert.equal(num, 2, 'composable does not own 2 tokens of type sampleNFT')
  });

  /*   TRANSFER COMPOSABLE   */
  it('should transfer composable to Bob and own it', async () => {
    const tx = await composable.transferFrom(alice, bob, 1);

    const address = await composable.ownerOf.call(1);
   
    assert(address == bob, 'composable not owned by bob');
  });

  it('alice should not own composable', async () => {

    const address = await composable.ownerOf.call(1);
   
    assert(address != alice, 'composable owned by alice');
  });
});