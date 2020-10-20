const generatePreview = require('ffmpeg-generate-video-preview');
const azurestorage = require('azure-storage');
const fs = require('fs');
const chokidar = require('chokidar');

module.exports = async function (context, myQueueItem) {

    try {

      var blobService = azurestorage.createBlobService(process.env.VIDEOFILESTORAGE);

      // myQueueItem contains the absolute URL to the blob
      // The assumption is that the filename is already unique
      var videoFileName = myQueueItem.split('/')[4];

      context.log('Processing Video File: ', videoFileName);

      var videoFilePath = __dirname + '/' + videoFileName;
      var previewFileName = videoFileName + '_keyframes.jpg';
      var previewFilePath = __dirname + '/' + previewFileName;

      var watcher = chokidar.watch(previewFilePath, {ignored: /^\./, persistent: true, awaitWriteFinish: true, ignoreInitial: true});

      await downloadVideoFile(blobService, videoFileName, videoFilePath);

      context.log('File downloaded, starting preview creation.');

      // generate multiple keyframes view of video.
      await generatePreview({
        input: videoFilePath,
        output: previewFilePath,
        width: 600,
        quality: 10,
        rows: 5,
        cols: 10
      });

      await checkForFileAndUpload(context, watcher, blobService, previewFileName, "keyframes");

      watcher.close();

      context.log('Tidying up temporary files');

      fs.unlinkSync(videoFilePath);
      fs.unlinkSync(previewFilePath);

      return {
          res: previewFilePath
      };

    } catch(err) {
      context.log(err);
    }
}

const downloadVideoFile = async (azureBlobService, videoFileName, localFileName) => {
  return new Promise((resolve, reject) => {
    azureBlobService.getBlobToLocalFile(process.env.VIDEOCONTAINER, videoFileName, localFileName, function(error, localFileName) {
          if (error) {
              reject(error);
          } else {
              resolve(localFileName);
          }
      });
  });
};

const checkForFileAndUpload = async (context, watcher, blobService, fileName, fileType) => {

  context.log(`Done with preview creation, uploading ${fileType} file.`);

  return new Promise((resolve, reject) => {

    watcher.on('add', (fileName) => {

      blobService.createBlockBlobFromLocalFile(process.env.THUMBNAILCONTAINER, fileName, fileName, (error, result, response) => {
        if (error) {
            context.log(error);
            reject(error);
        } else {
          context.log(`Local file "${result.name}" was uploaded.`);
          resolve(response);
        }
      });
    });
  });
}