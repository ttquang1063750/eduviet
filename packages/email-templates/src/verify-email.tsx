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

interface VerifyEmailProps {
  name: string;
  verifyUrl: string;
}

export const VerifyEmail = ({
  name = 'User',
  verifyUrl = 'https://eduviet.local/verify',
}: VerifyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for EduViet</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify your email address</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            Please verify your email address to complete your EduViet registration.
          </Text>
          <Link href={verifyUrl} style={button}>
            Verify Email
          </Link>
          <Text style={text}>
            Or copy and paste this URL into your browser:
            <br />
            <Link href={verifyUrl}>{verifyUrl}</Link>
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

export default VerifyEmail;
