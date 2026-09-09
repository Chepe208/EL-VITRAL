'use client';

import { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const CaptchaWidget = forwardRef<ReCAPTCHA, React.ComponentProps<typeof ReCAPTCHA>>(
  function CaptchaWidget(props, ref) {
    return <ReCAPTCHA ref={ref} {...props} />;
  }
);

export default CaptchaWidget;