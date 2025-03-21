const sharp = require('sharp'); //calling sharp library


//Temporary process function to check sharp is working properly
(async function () {
    try {
        const info = await sharp("backend/src/img/3839343136_dcab303604_o.gif") //Gets image to process from file
            .toFormat('gif') // Ensure output is a GIF
            .toFile("backend/src/img_edited/3839343136_dcab303604_o_edited.gif"); // Specify full output path


        console.log("Image processed successfully:", info);
    } catch (error) {
        console.error("Error processing image:", error);
    }
})();
