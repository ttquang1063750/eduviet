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

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export const WelcomeEmail = ({
  name = 'Student',
  loginUrl = 'https://eduviet.local/login',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to EduViet</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to EduViet, {name}!</Heading>
          <Text style={text}>
            We're thrilled to have you join our learning platform. You can now explore courses, interact with teachers, and track your progress.
          </Text>
          <Text style={text}>
            Get started by logging into your account:
          </Text>
          <Link href={loginUrl} style={button}>
            Log In
          </Link>
          <Text style={text}>
            If you have any questions, feel free to reply to this email.
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

export default WelcomeEmail;
