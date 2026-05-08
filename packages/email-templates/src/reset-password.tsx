import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

interface ResetPasswordProps {
  name: string;
  resetUrl: string;
}

export const ResetPasswordEmail = ({
  name = 'User',
  resetUrl = 'https://eduviet.local/reset-password',
}: ResetPasswordProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your EduViet password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            Someone recently requested a password change for your EduViet account. If this was you, you can set a new password here:
          </Text>
          <Link href={resetUrl} style={button}>
            Reset Password
          </Link>
          <Text style={text}>
            If you don't want to change your password or didn't request this, just ignore and delete this message.
          </Text>
          <Text style={text}>
            To keep your account secure, please don't forward this email to anyone.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  padding: '0 24px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
  padding: '0 24px 20px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '100%',
  marginBottom: '20px',
};

export default ResetPasswordEmail;
