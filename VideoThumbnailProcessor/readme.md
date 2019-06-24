# Video Thumbnailer - QueueTrigger - JavaScript

This Azure Function is triggered by a new Azure Storage Queue message. The Queue message contains the name of a video file we wish to thumbnail.

The video file must have been uploaded into an Azure Blob Storage Account Container that has been configured as the file source for the Function.
