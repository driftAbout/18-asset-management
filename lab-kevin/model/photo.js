'use strict';
const fs = require('fs');
const del = require('del');
const path = require('path');
const tempDir = require(`${__dirname}/../temp`);
const aws3 = require('../lib/aws-sdkß');
const mongoose = require(mongoose);


const Photo = mongoose.Schema({
  image_url: {type: String, required: true, unique: true},
  name: {type: String, required: true},
  description: {type: String, required: true},
  user_id: {type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: 'auth'},
  gallery_id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'gallery'},
  cloud_key: {type: String, required: true, unique: true},
},
{timestamps: true}
); 

Photo.statics.upload = function(req) {
  return new Promise((resolve, reject) => {
    if(!req.file) return  reject(new Error('Multi-part form data error: missing file data'))
    if(!req.file_path) return  reject(new Error('Multi-part form data error: missing file path'))

    let metadata =  {
      'x-amz-meta-original_filename': `${req.file.original_name}`,
      'x-amz-meta-original_user_id': `${req.user.user_id}`,
    };

    let params = {
      ACL: 'public-read',
      Bucket: process.env.AWS_BUCKET,
      Key: `${req.file.filename}${path.extname(req.file.original_name)}`,
      Body: fs.writeStream(req.file.path),
      Metadata: metadata,
    };

    return(aws3.uploadProm(params))
      .then(data =>{
        del(`${tempDir}/${req.file.filename}`);

        let photoData = {
          image_url: data.location,
          name: req.body.name,
          description: req.body.description,
          user_id: req.user.user_id,
          gallery_id: req.body.gallery_id,
          cloud_key: data.key,
        };
        resolve(photoData);
      })
      .catch(reject);
  });
 
};

module.exports = mongoose.model('photo', Photo);