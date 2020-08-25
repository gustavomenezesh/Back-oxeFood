
const fs = require("fs");
const {google} = require('googleapis');
 
function imageUpload(fileName, filePath, callback){
    require("./gdrive-oauth")((auth) => {
        const fileMetadata = {
            name: fileName
        };
 
        const media = {
            mimeType: "image/jpeg",
            body: fs.createReadStream(filePath)
        }
        
        const drive = google.drive({version: 'v3', auth});
        drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, thumbnailLink'
          }, function (err, file) {
            if (err) {
              // Handle error
              console.error(err);
            } else {
              callback(file.data.thumbnailLink);
            }
          });
    });
}
 
module.exports = { imageUpload };