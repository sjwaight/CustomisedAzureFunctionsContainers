FROM mcr.microsoft.com/azure-functions/node:2.0

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY . /home/site/wwwroot

# Install FFMPEG
RUN apt-get update && \
    apt-get install -y ffmpeg

RUN cd /home/site/wwwroot && \
    npm install