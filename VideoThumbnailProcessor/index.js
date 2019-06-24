const generatePreview = require('ffmpeg-generate-video-preview');
const azurestorage = require('azure-storage');
const guid = require('node-uuid');
const fs = require('fs');
const chokidar = require('chokidar');

module.exports = async function (context, myQueueItem) {

    try {

      context.log('Processing Video File: ', myQueueItem);

      var blobService = azurestorage.createBlobService(process.env.VIDEOFILESTORAGE);

      var videoFileName = guid.v1() + '-' + myQueueItem;
      var videoFilePath = __dirname + '/' + videoFileName;
      var previewFileName = videoFileName + '_preview.jpg';
      var previewFilePath = __dirname + '/' + previewFileName;

      var watcher = chokidar.watch(previewFilePath, {ignored: /^\./, persistent: true, awaitWriteFinish: true, ignoreInitial: true});

      await downloadVideoFile(blobService, myQueueItem, videoFilePath);

      context.log('File Downloaded, starting preview creation.');

      await generatePreview({
        input: videoFilePath,
        output: previewFilePath,
        width: 600,
        quality: 10,
        rows: 5,
        cols: 10
      });

      await checkForFileAndUpload(context, watcher, blobService, previewFilePath, previewFileName, videoFilePath);

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

const checkForFileAndUpload = async (context, watcher, blobService, previewFilePath, previewFileName, videoFilePath) => {

  context.log('Done with preview creation, uploading preview file.');

  return new Promise((resolve, reject) => {

    watcher.on('add', (path) => {

      blobService.createBlockBlobFromLocalFile(process.env.THUMBNAILCONTAINER, previewFileName, previewFilePath, (error, result, response) => {
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
