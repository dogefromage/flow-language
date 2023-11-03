import { except } from '@noodles/editor';
import { supabase } from "./supabase";

export async function startOAuthSignIn() {
    const targetOrigin = import.meta.env.VITE_FRONT_PAGE_URL;
    const authSlug = import.meta.env.VITE_FRONT_PAGE_AUTH_SLUG;
    const popupUrl = `${targetOrigin}${authSlug}`;

    const popup = window.open(popupUrl, 'popup', /* 'popup=true' */);
    if (!popup) {
        except('Could not open popup.');
    }

    try {
        const tokens = await getTokensFromPopup(popup, targetOrigin);
        await supabase.auth.setSession(tokens);
    } catch (e: any) {
        except(e.message);
    }
}

function getTokensFromPopup(popup: Window, targetOrigin: string) {
    type Tokens = Parameters<typeof supabase.auth.setSession>[0];

    return new Promise<Tokens>((res, rej) => {
        const checkPopup = setInterval(() => {
            popup.postMessage('oauth_tokens', targetOrigin);

            if (popup.closed) {
                clearInterval(checkPopup);
                rej('OAuth did not return any credentials.');
            }

        }, 1000);

        window.addEventListener('message', e => {
            const tokens: Tokens = e.data;
            popup.close();
            if (typeof tokens !== 'object' ||
                typeof tokens.access_token !== 'string' ||
                typeof tokens.refresh_token !== 'string') {
                rej('OAuth returned incorrect credentials.');
            } else {
                res(tokens);
            }
        })
    });
}