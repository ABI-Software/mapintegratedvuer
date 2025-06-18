import fs from "fs";

function deleteFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        // console.log(`Delete folder: ${folderPath}`);
    }
}

function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        // console.log(`Created folder : ${folderPath}`);
    }
}

function copyFile(srcFile, destFile) {
    fs.copyFileSync(srcFile, destFile);
    // console.log(`Copied ${srcFile} to ${destFile}`);
}

const rootFolder = "./cypress/snapshots";

deleteFolder(rootFolder);

const foldersToCreate = [
    "./cypress/snapshots/base/cypress/component/MapContent.cy.js",
    "./cypress/snapshots/MapContent.cy.js/base/cypress/component/MapContent.cy.js",
];

// prepare minimap image for visual regression test
const filesToCopy = [
    {
        src: "./cypress/fixtures/minimap_hr.png",
        destFolder: "./cypress/snapshots/base/cypress/component/MapContent.cy.js",
    },
    {
        src: "./cypress/fixtures/minimap_lr.png",
        destFolder: "./cypress/snapshots/base/cypress/component/MapContent.cy.js",
    },
    {
        src: "./cypress/fixtures/minimap_hr.png",
        destFolder: "./cypress/snapshots/MapContent.cy.js/base/cypress/component/MapContent.cy.js",
    },
    {
        src: "./cypress/fixtures/minimap_lr.png",
        destFolder: "./cypress/snapshots/MapContent.cy.js/base/cypress/component/MapContent.cy.js",
    },
];

foldersToCreate.forEach(createFolder);

filesToCopy.forEach(({ src, destFolder }) => {
    const fileName = src.split("/").pop();
    const destFilePath = `${destFolder}/${fileName}`;
    copyFile(src, destFilePath);
});
