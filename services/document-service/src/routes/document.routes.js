const express = require('express');
const { body, validationResult } = require('express-validator');
const documentService = require('../services/document.service');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/',
  authenticate,
  [
    body('title').notEmpty().trim(),
    body('type').notEmpty().isIn(['pdf', 'word', 'excel', 'ppt', 'txt', 'markdown', 'other'])
  ],
  validate,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { title, type, metadata } = req.body;
      const document = await documentService.uploadDocument({
        file: req.file,
        title,
        type,
        metadata: metadata ? JSON.parse(metadata) : {}
      });

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const metadata = await documentService.getDocumentMetadata(id);

      if (!metadata) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const downloadUrl = await documentService.getPresignedDownloadUrl(id, metadata.key);

      res.json({
        ...metadata,
        downloadUrl
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id/download',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const metadata = await documentService.getDocumentMetadata(id);

      if (!metadata) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const downloadUrl = await documentService.getPresignedDownloadUrl(id, metadata.key);
      res.json({ downloadUrl, expiresIn: 3600 });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const metadata = await documentService.getDocumentMetadata(id);

      if (!metadata) {
        return res.status(404).json({ error: 'Document not found' });
      }

      await documentService.deleteDocument(id, metadata.key);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/',
  authenticate,
  async (req, res, next) => {
    try {
      const { prefix, maxKeys } = req.query;
      const result = await documentService.listDocuments({
        prefix: prefix || '',
        maxKeys: maxKeys ? parseInt(maxKeys) : 100
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;