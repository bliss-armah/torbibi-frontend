'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '../hooks/useAuth';

const phoneSchema = z.object({
  phone: z
    .string()
    .regex(
      /^(\+233|0)(2[034567]|5[045679])\d{7}$/,
      'Enter a valid Ghanaian number (e.g. 0241234567)'
    ),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

interface BuyerLoginFormProps {
  redirectTo: string;
}

export function BuyerLoginForm({ redirectTo }: BuyerLoginFormProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const { sendOtp, confirmOtp, isLoading, error } = useAuth();

  const form = useForm<PhoneFormValues>({ resolver: zodResolver(phoneSchema) });

  const onPhoneSubmit = async (data: PhoneFormValues) => {
    const success = await sendOtp(data.phone);
    if (success) {
      setPhone(data.phone);
      setStep('otp');
    }
  };

  const onOtpSubmit = async () => {
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit code sent to your phone');
      return;
    }
    setOtpError('');
    await confirmOtp(phone, otp, 'login', redirectTo);
  };

  if (step === 'otp') {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-center text-sm text-muted-foreground">
          We sent a 6-digit code to <strong>{phone}</strong>
        </p>

        <div className="flex flex-col items-center gap-2">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isLoading}>
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {(otpError || error) && (
            <p className="text-sm text-destructive" role="alert">
              {otpError || error}
            </p>
          )}
        </div>

        <Button onClick={onOtpSubmit} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? 'Verifying…' : 'Verify'}
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setOtp('');
          }}
          className="text-center text-sm text-primary hover:underline"
        >
          Use a different number
        </button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onPhoneSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  inputMode="tel"
                  placeholder="0241234567"
                  autoComplete="tel"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="w-full" size="lg">
          {isLoading ? 'Sending code…' : 'Get verification code'}
        </Button>
      </form>
    </Form>
  );
}
