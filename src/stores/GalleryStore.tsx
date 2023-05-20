import React, { createContext } from 'react';
import { observable } from 'mobx';
import { useLocalStore } from 'mobx-react-lite';
import * as api from '../utils/api';
import Storage from '../utils/Storage';
import dayjs from 'dayjs';

export const createStore = () => {
  const store = observable({
    page: 1,
    xRestrict: false,
    usersIriTag: '',
    rankMode: 'day',
    rankDate: dayjs().subtract(2, 'days').format('YYYY-MM-DD'),
    isPopPreview: false,
    isFetching: false,
    isError: false,
    errorMsg: '',
    errorTimes: 0,
    items: [] as any[],
    images: [] as string[],
    isFetchingTags: false,
    tags: [] as any[],
    word: 'ranking',
    fromIllust: false,

    async fetchSource() {
      if (store.isFetching) {
        return;
      }
      store.isError = false;
      store.isFetching = true;
      try {
        let data;
        if (store.word === 'ranking') {
          data = await api.ranking(store.page, store.rankMode, store.rankDate);
        } else {
          let word = store.word;
          if (store.isPopPreview) {
            data = await api.popPreview(word);
          } else {
            if (!store.xRestrict) word += ' -R-18 -R18 -18+';
            if (store.usersIriTag) word += ' ' + store.usersIriTag;
            data = await api.search({
              word,
              page: store.page
              // x_restrict: store.xRestrict ? 1 : 0
            });
          }
        }
        if (data.response.illusts && data.response.illusts.length > 0) {
          store.items = [...store.items, ...data.response.illusts];
        } else {
          store.isError = true;
          store.errorTimes = store.errorTimes + 1;
        }
        store.page = store.page + 1;
      } catch (err) {
        if (err instanceof api.APIError) {
          store.errorMsg = err.message;
        } else {
          store.errorMsg = '';
        }
        store.isError = true;
        store.errorTimes = store.errorTimes + 1;
      } finally {
        store.isFetching = false;
      }
    },

    async fetchTags() {
      store.isFetchingTags = true;
      try {
        const data = await api.tags({
          lang: Storage.get('lang')
        });
        if (data.response.trend_tags) {
          store.tags = data.response.trend_tags;
        }
      } finally {
        store.isFetchingTags = false;
      }
    },

    clearErrorTimes() {
      store.errorTimes = 0;
    },

    clearSource() {
      store.items = [];
      store.images = [];
    },

    setWord(word: string) {
      store.word = word;
    },

    setFromIllust(fromIllust: boolean) {
      store.fromIllust = fromIllust;
    }
  });
  return store;
};

type GalleryStore = ReturnType<typeof createStore>;

export const GalleryContext = createContext<GalleryStore>({} as GalleryStore);

export const GalleryProvider: React.FC<{}> = props => {
  const store = useLocalStore(createStore);

  return (
    <GalleryContext.Provider value={store}>
      {props.children}
    </GalleryContext.Provider>
  );
};
