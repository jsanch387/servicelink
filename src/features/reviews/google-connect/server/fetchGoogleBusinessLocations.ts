type GoogleAccount = {
  name?: string;
};

type GoogleLocation = {
  name?: string;
  title?: string;
};

export type GoogleBusinessLocationPick = {
  googleAccountName: string | null;
  googleLocationName: string | null;
  googleLocationTitle: string | null;
};

export type FetchGoogleBusinessLocationsResult =
  | { ok: true; location: GoogleBusinessLocationPick }
  | { ok: false; status: number; error: string };

function accountsListErrorMessage(status: number): string {
  if (status === 429) {
    return 'Google has not given this project API quota yet. That is the access request after your listing has been live 60 days.';
  }
  if (status === 403) {
    return 'Google blocked listing access. Enable My Business Account Management API, then try again.';
  }
  return 'Google could not list your business accounts.';
}

const EMPTY_LOCATION: GoogleBusinessLocationPick = {
  googleAccountName: null,
  googleLocationName: null,
  googleLocationTitle: null,
};

async function listLocationsForAccount(
  accessToken: string,
  accountName: string
): Promise<GoogleLocation[]> {
  const url = new URL(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`
  );
  url.searchParams.set('readMask', 'name,title');
  url.searchParams.set('pageSize', '100');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.warn('[reviews:google-connect] list locations failed', {
      status: response.status,
      accountName,
    });
    return [];
  }

  const json = (await response.json().catch(() => null)) as {
    locations?: GoogleLocation[];
  } | null;
  return Array.isArray(json?.locations) ? json.locations : [];
}

/**
 * Finds the first Google Business location on the connected account.
 */
export async function fetchGoogleBusinessLocationPick(
  accessToken: string
): Promise<FetchGoogleBusinessLocationsResult> {
  try {
    const accountsRes = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!accountsRes.ok) {
      console.warn('[reviews:google-connect] list accounts failed', {
        status: accountsRes.status,
      });
      return {
        ok: false,
        status: accountsRes.status,
        error: accountsListErrorMessage(accountsRes.status),
      };
    }

    const accountsJson = (await accountsRes.json().catch(() => null)) as {
      accounts?: GoogleAccount[];
    } | null;
    const accounts = (Array.isArray(accountsJson?.accounts)
      ? accountsJson.accounts
      : []
    ).filter(
      (account): account is { name: string } =>
        typeof account.name === 'string' && account.name.trim().length > 0
    );

    if (accounts.length === 0) {
      return {
        ok: false,
        status: 404,
        error:
          'Google did not return a business account. Use the Google account that manages the listing.',
      };
    }

    for (const account of accounts) {
      const locations = await listLocationsForAccount(
        accessToken,
        account.name
      );
      const firstLocation = locations.find(
        location => typeof location.name === 'string' && location.name.trim()
      );
      if (!firstLocation?.name) continue;

      return {
        ok: true,
        location: {
          googleAccountName: account.name,
          googleLocationName: firstLocation.name,
          googleLocationTitle:
            typeof firstLocation.title === 'string'
              ? firstLocation.title
              : null,
        },
      };
    }

    return {
      ok: true,
      location: {
        ...EMPTY_LOCATION,
        googleAccountName: accounts[0]?.name ?? null,
      },
    };
  } catch (error) {
    console.warn('[reviews:google-connect] location lookup failed', error);
    return {
      ok: false,
      status: 500,
      error: 'Could not reach Google to find your listing.',
    };
  }
}
