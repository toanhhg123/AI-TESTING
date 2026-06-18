const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
