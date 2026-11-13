const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => {
        const path = issue.path.join('.') || 'field';
        return `${path}: ${issue.message}`;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }
    req.body = parsed.data;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validate };

