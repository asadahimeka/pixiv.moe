import honoka from 'honoka';
import * as config from '../config';
import Storage from './Storage';

interface PixivResponse {
  [key: string]: any;
}

export class APIError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

honoka.defaults.baseURL = config.apiBaseURL;
honoka.defaults.timeout = 60e3;

export const getAuth = () => {
  return Storage.get('auth');
};

export const setAuth = (authData: any, setAuthFunc?: (data: any) => void) => {
  if (setAuthFunc) {
    setAuthFunc(authData);
  }
  return Storage.set('auth', authData);
};

export const removeAuth = (setAuthFunc?: (data: any) => void) => {
  if (setAuthFunc) {
    setAuthFunc(null);
  }

  return Storage.remove('auth');
};

honoka.interceptors.register({
  request: options => {
    // if (getAuth()?.access_token) {
    //   options.headers['Proxy-Authorization'] = `Bearer ${
    //     getAuth()?.access_token
    //   }`;
    // }
    // if (Storage.get('token')) {
    //   options.headers.Authorization = `Uid ${Storage.get('token')}`;
    // }
    return options;
  },
  response: response => {
    // if (response.data?.code !== 200) {
    //   return new APIError(response.data?.message);
    // }
    if (response.data?.error || response.data?.detail) {
      return new APIError(response.data?.error || response.data?.detail);
    }
    return {
      response: response.data
    };
  }
});

export const session = () => honoka.get('/session') as Promise<PixivResponse>;

export const channels = () =>
  honoka.get('/v2/channels') as Promise<PixivResponse>;

export const tags = (data: { lang: string }) =>
  honoka.get('/tags', {
    data
  }) as Promise<PixivResponse>;

export const ranking = (page: number) =>
  honoka.get('/rank', {
    data: {
      page
    }
  }) as Promise<PixivResponse>;

export const search = (data: { word: string; page: number }) =>
  honoka.get('/search', {
    data
  }) as Promise<PixivResponse>;

export const searchBeta = (data: {
  word: string;
  page: number;
  x_restrict: number;
}) =>
  honoka.get('/v2/search/beta', {
    data
  }) as Promise<PixivResponse>;

export const illust = (illustId: number | string) =>
  honoka.get(`/illust?id=${illustId}`) as Promise<PixivResponse>;

export const illustUgoira = (illustId: number | string) =>
  honoka.get(`/ugoira_metadata?id=${illustId}`) as Promise<PixivResponse>;

export const illustComments = (
  illustId: number | string,
  data: {
    page: number;
  }
) =>
  honoka.get(`/illust_comments?id=${illustId}`, {
    data
  }) as Promise<PixivResponse>;

export const illustBookmarkDetail = (illustId: number | string) =>
  honoka.get(`/v1/illust/bookmark/${illustId}`) as Promise<PixivResponse>;

export const illustBookmarkAdd = (illustId: number | string) =>
  honoka.post(`/v1/illust/bookmark/${illustId}`) as Promise<PixivResponse>;

export const illustBookmarkDelete = (illustId: number | string) =>
  honoka.delete(`/v1/illust/bookmark/${illustId}`) as Promise<PixivResponse>;

export const proxyImage = (url: string) => {
  if (!url) {
    return url;
  }
  // const regex = /^https?:\/\/(i\.pximg\.net)|(source\.pixiv\.net)/i;
  const regex = /^https?:\/\/(i\.pximg\.net)/i;
  if (regex.test(url)) {
    url = url.replace('i.pximg.net', 'pximg.cocomi.cf');
    // url = `https://api.pixiv.moe/image/${url.replace(/^https?:\/\//, '')}`;
    // if (
    //   process.env.NODE_ENV !== 'test' &&
    //   document.body.classList.contains('supports-webp') &&
    //   (url.indexOf('.png') > -1 ||
    //     url.indexOf('.jpg') > -1 ||
    //     url.indexOf('.jpeg') > -1)
    // ) {
    //   url = `${url}@progressive.webp`;
    // }
  }

  return url;
};

export const auth = (data: {
  username?: string;
  password?: string;
  refreshToken?: string;
}) =>
  honoka.post('/v1/auth', {
    data: {
      username: data.username,
      password: data.password,
      refresh_token: data.refreshToken
    }
  }) as Promise<PixivResponse>;

export const refreshToken = () => {
  const authData = getAuth();
  if (authData?.refresh_token) {
    auth({ refreshToken: authData.refresh_token })
      .then(data => {
        setAuth(data.response);
      })
      .catch(err => {
        if (err.message === 'Invalid refresh token') {
          removeAuth();
          location.reload();
        }
      });
  }
};
