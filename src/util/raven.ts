import * as raven from 'raven-js';

import { SENTRY_URL } from '../../common.config';

const Raven = new (raven as any).Client();
Raven.config(SENTRY_URL).install();

export default Raven;
