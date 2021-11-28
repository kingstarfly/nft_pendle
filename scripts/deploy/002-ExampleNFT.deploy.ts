import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const chainId = await hre.getChainId();

  await hre.deployments.deploy('ExampleNft', {
    from: deployer,
    args: ['BASE_ABI'],
    log: true,
  });
};

deployFunc.tags = ['ExampleNft'];

export default deployFunc;
