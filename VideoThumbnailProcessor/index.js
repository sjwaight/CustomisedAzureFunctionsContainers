const generatePreview = require('ffmpeg-generate-video-preview');
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const fs = require('fs');
const chokidar = require('chokidar');

// Azure Storage Account name and key
const account = process.env.STORAGE_ACCOUNT_NAME || "";
const accountKey = process.env.ACCOUNT_ACCESS_KEY || "";
const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net`,sharedKeyCredential);

module.exports = async function (context, myQueueItem) {

    try {

      // myQueueItem contains the absolute URL to the blob
      // The assumption is that the filename is already unique
      var videoFileName = myQueueItem.split('/')[4];

      context.log('Processing Video File: ', videoFileName);

      var videoFilePath = __dirname + '/' + videoFileName;
      var previewFileName = videoFileName + '_keyframes.jpg';
      var previewFilePath = __dirname + '/' + previewFileName;

      var watcher = chokidar.watch(previewFilePath, {ignored: /^\./, persistent: true, awaitWriteFinish: true, ignoreInitial: true});
    
      var containerClient = blobServiceClient.getContainerClient(process.env.VIDEOCONTAINER);
      var blockBlobClient = containerClient.getBlockBlobClient(videoFileName);

      await blockBlobClient.downloadToFile(videoFilePath)

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

      await checkForFileCreation(context, watcher, previewFilePath, "keyframes");

      context.log('Uploading preview image to Azure Storage.');

      containerClient = blobServiceClient.getContainerClient(process.env.THUMBNAILCONTAINER);
      blockBlobClient = containerClient.getBlockBlobClient(previewFileName);
      await blockBlobClient.uploadFile(previewFilePath);

      watcher.close();

      context.log('Tidying up temporary files.');

      fs.unlinkSync(videoFilePath);
      fs.unlinkSync(previewFilePath);

      context.log('All done!');

      return {
          res: previewFilePath
      };

    } catch(err) {
      context.log(err);
    }
}

// Wrap Chokidar as it is a sync call and we need async behaviour.
// we want to ensure that the preview file has been written to disk and
// the file writer has close the stream before we try and upload.
const checkForFileCreation = async (context, watcher, localFileName, fileType) => {

  return new Promise((resolve, reject) => {

    watcher.on('add', localFileName => {
        context.log(`Local file was created.`);
        resolve();
    });
  });
}