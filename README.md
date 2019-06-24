# Azure Functions running in customised Containers

This repository contains a simple NodeJS Azure Function that uses [FFMPEG](https://ffmpeg.org/) to generate a composite thumbbail for supplied MP4 videos.

## Try it out

If you'd like to experiment with this solution you will need the following:

- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [Visual Studio Code](https://code.visualstudio.com/Download)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
- [Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

All the above tools will run on Mac, Linux or Windows :neckbeard:

In Azure the components you'll need to setup are:

- An Azure Storage Account
  - Blob Storage Containers for Videos and Thumbnails
  - Storage Queue to use for triggering Function
- An Azure Container Registry (you can also use Docker Hub if you'd prefer)
- An App Service Plan running Linux
  - An Azure Function configured for Docker deployments
- An Azure Kubernetes Service (AKS) cluster with virtual nodes enabled.

Your experimentation will be helped by grabbing the [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/) as well.

## Running on Azure App Service

This is well documented by the Functions team [on Microsoft Docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-function-linux-custom-image).

## Running on Kubernetes using KEDA

This sample is based on one of the existing KEDA samples. If you [read the sample documentation](https://github.com/kedacore/sample-hello-world-azure-functions) for that you will be able to figure out how to deploy your Function onto Kubernetes and use KEDA.
