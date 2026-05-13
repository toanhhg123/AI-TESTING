function notImplemented(featureName) {
  return (req, res) => {
    res.status(501).json({
      message: `${featureName} is not implemented yet.`,
    });
  };
}

module.exports = {
  notImplemented,
};
