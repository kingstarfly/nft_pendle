import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const chainId = await hre.getChainId();

  await hre.deployments.deploy('ExampleERC20', {
    from: deployer,
    args: [],
    log: true,
  });
};

deployFunc.tags = ['ExampleERC20'];

export default deployFunc;
