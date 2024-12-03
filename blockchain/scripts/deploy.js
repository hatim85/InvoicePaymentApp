async function main() {
    const BlockInvoice = await ethers.getContractFactory("BlockInvoice");
    const blockInvoice = await BlockInvoice.deploy();
    await blockInvoice.waitForDeployment();
    console.log("BlockInvoice deployed to:", blockInvoice.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
