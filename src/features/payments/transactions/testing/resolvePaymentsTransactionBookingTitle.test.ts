import { describe, expect, it } from 'vitest';
import { resolvePaymentsTransactionBookingTitle } from '../resolvePaymentsTransactionBookingTitle';

describe('resolvePaymentsTransactionBookingTitle', () => {
  it('uses the first job name and extraCount from job_details', () => {
    expect(
      resolvePaymentsTransactionBookingTitle({
        serviceName: 'Mixed jobs',
        jobDetails: [
          { serviceName: 'Signature Shine', servicePriceCents: 18900 },
          { serviceName: 'Interior', servicePriceCents: 8000 },
        ],
      })
    ).toEqual({
      title: 'Signature Shine',
      extraCount: 1,
      serviceName: 'Signature Shine',
      jobCount: 2,
    });
  });

  it('strips a pricing tier from the stored service name', () => {
    expect(
      resolvePaymentsTransactionBookingTitle({
        serviceName: 'Signature Shine — SUV',
      })
    ).toMatchObject({
      title: 'Signature Shine',
      extraCount: 0,
      jobCount: 1,
    });
  });

  it('parses +N more without putting it in the title', () => {
    expect(
      resolvePaymentsTransactionBookingTitle({
        serviceName: 'Signature Shine — SUV + 2 more',
      })
    ).toEqual({
      title: 'Signature Shine',
      extraCount: 2,
      serviceName: 'Signature Shine',
      jobCount: 3,
    });
  });

  it('rejects Mixed jobs and Double jobs', () => {
    expect(
      resolvePaymentsTransactionBookingTitle({ serviceName: 'Mixed jobs' })
    ).toEqual({
      title: null,
      extraCount: 0,
      serviceName: null,
      jobCount: 0,
    });
    expect(
      resolvePaymentsTransactionBookingTitle({ serviceName: 'Double jobs' })
    ).toMatchObject({ title: null });
  });
});
