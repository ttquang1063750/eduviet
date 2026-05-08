import { render } from '@react-email/render';
import React from 'react';

import { WelcomeEmail } from './welcome';
import { VerifyEmail } from './verify-email';
import { ResetPasswordEmail } from './reset-password';

export const renderWelcomeEmail = (props: React.ComponentProps<typeof WelcomeEmail>) => {
  return render(React.createElement(WelcomeEmail, props));
};

export const renderVerifyEmail = (props: React.ComponentProps<typeof VerifyEmail>) => {
  return render(React.createElement(VerifyEmail, props));
};

export const renderResetPasswordEmail = (props: React.ComponentProps<typeof ResetPasswordEmail>) => {
  return render(React.createElement(ResetPasswordEmail, props));
};

export { WelcomeEmail, VerifyEmail, ResetPasswordEmail };
