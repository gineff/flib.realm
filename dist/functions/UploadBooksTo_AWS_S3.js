const bucket = 'flib.s3'
const libUrl = 'http://flibusta.is'
const proxyImageUrl = 'https://images.weserv.nl/?url='

async function isS3KeyExists(key) {
  const url = `https://hb.bizmrg.com/flib.s3/${key}`
  const res = await context.http.head({ url })
  return res.statusCode === 200
}

const initStream = _id => {
  const axios = require('axios').default
  const stream = require('stream')
  let fb2FileName
  return {
    getFb2FileName: () => fb2FileName,
    configureParams: async (url, key) => {
      const pass = new stream.PassThrough()
      let response,
        fb2FileName,
        Key = key
      try {
        response = await axios.get(url, { responseType: 'stream' })
        response.data.pipe(pass)
      } catch (e) {
        console.log(e)
        return
      }

      const ContentType = response.headers['content-type'] || 'octet-stream'
      if (!Key) {
        fb2FileName = response.headers['content-disposition']
          ?.split('=')[1]
          ?.replace(/\"/g, '')
        Key = `${_id}/${fb2FileName}`
      }

      return { Bucket: bucket, Key, ContentType, Body: pass }
    },
  }
}

const getFb2Url = downloads =>
  downloads?.find(el => el.type === 'application/fb2+zip')?.href

const initAWSUploader = (fullDocument, clientS3) => {
  const { _id, image, downloads } = fullDocument

  const streamInstance = initStream(_id)

  const uploadFb2Attachment = async () => {
    const fb2AttachmentUrl = getFb2Url(downloads)
    if (!fb2AttachmentUrl) {
      return
    }
    const url = `${libUrl}${fb2AttachmentUrl}`
    const params = await streamInstance.configureParams(url)
    fullDocument.fb2FileName = streamInstance.getFb2FileName()
    clientS3.upload(params, (err, data) => {
      if (err) {
        console.log('fb2 stream error', err)
      }
    })
  }

  const uploadBookJson = async () => {
    params = {
      Bucket: bucket,
      Key: `${_id}/book.json`,
      ContentType: 'application/json',
      Body: JSON.stringify(fullDocument),
    }
    clientS3.upload(params, (err, data) => {
      if (err) {
        console.log('book.json error', err)
      }
    })
  }

  const uploadImages = async h => {
    if (!image) {
      return
    }
    const imageKey = `${_id}/${h}-cover.jpg`
    const url = `${proxyImageUrl}${libUrl}${image}&h=${h}`
    const params = await streamInstance.configureParams(url, imageKey)
    clientS3.upload(params, (err, data) => {
      if (err) {
        console.log('image stream error', err)
      }
    })
  }
  return { uploadFb2Attachment, uploadBookJson, uploadImages }
}

exports = async function uploadBooks(changeEvent) {
  const Books = context.services
    .get('mongodb-atlas')
    .db('flibusta')
    .collection('Books')
  const { fullDocument, operationType, updateDescription = {} } = changeEvent
  const { _id, fb2FileName, expires, image } = fullDocument

  const { aws } = context.functions.execute('mainFunctions')
  const clientS3 = await aws()
  const loader = initAWSUploader(fullDocument, clientS3)

  const { updatedFields } = updateDescription || {}
  if (operationType === 'update' && updatedFields?.expires) {
    const objects = [
      ...(fb2FileName ? [{ key: fb2FileName }] : []),
      { key: 'book.json' },
      ...(image ? [{ key: '167-cover.jpg' }, { key: '500-cover.jpg' }] : []),
    ]

    const uploadFunctions = {
      'book.json': loader.uploadBookJson,
      '167-cover.jpg': loader.uploadImages.bind(null, '167'),
      '500-cover.jpg': loader.uploadImages.bind(null, '500'),
    }

    for (const object of objects) {
      const { key } = object
      const params = {
        Bucket: bucket,
        CopySource: `${bucket}/${_id}/${key}`,
        Key: `${_id}/${key}`,
        MetadataDirective: 'REPLACE',
        Expires: expires,
      }

      if (await isS3KeyExists(`${_id}/${key}`)) {
        clientS3.copyObject(params, err => {
          if (err) {
            console.log(`Error copying object ${key}`, err)
          }
        })
      } else {
        const uploadFunction =
          uploadFunctions[key] ?? loader.uploadFb2Attachment
        await uploadFunction()
      }
    }
  }

  if (operationType === 'insert') {
    await loader.uploadFb2Attachment()
    await loader.uploadBookJson()
    await loader.uploadImages('167')
    await loader.uploadImages('500')
    const { fb2FileName } = fullDocument
    Books.updateOne({ _id }, { $set: { s3: true, fb2FileName } })
  }
}
