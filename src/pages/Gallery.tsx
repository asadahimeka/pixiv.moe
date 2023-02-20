import React, { useState, useContext, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useMount } from 'ahooks';
import makeStyles from '@mui/styles/makeStyles';
import {
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  // Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Box,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Menu as MenuIcon,
  Done as DoneIcon
  // Cached as CachedIcon
} from '@mui/icons-material';
import { useIntl } from 'react-intl';
import { useObserver } from 'mobx-react-lite';

import * as config from '../config';

import GalleryList from '../components/GalleryList';
import Loading from '../components/Loading';
// import Refresh from '../components/Refresh';
import Message from '../components/Message';
import SearchInput, {
  SearchOptions,
  SearchInputHandles
} from '../components/SearchInput';

import Storage from '../utils/Storage';
// import * as api from '../utils/api';

import LayoutContainer, {
  LayoutContainerHandles
} from '../containers/LayoutContainer';

import { GalleryContext } from '../stores/GalleryStore';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDayjs from '@mui/lab/AdapterDayjs';
import { DatePicker } from '@mui/lab';

const useStyles = makeStyles({
  root: {
    margin: '0 auto'
    // paddingLeft: 3,
    // paddingRight: 20
  },
  refreshBtn: {
    textAlign: 'center',
    marginBottom: 10
  }
});

const Gallery: React.FC<{}> = () => {
  const classes = useStyles();
  const intl = useIntl();
  const location = useLocation();
  const history = useHistory();
  const gallery = useContext(GalleryContext);
  const [shouldLogin] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    xRestrict: Storage.get('x_restrict') || false
  });
  const layoutRef = useRef<LayoutContainerHandles>(null);
  const inputRef = useRef<SearchInputHandles>(null);

  const fetchSource = (isFirstLoad: boolean) => {
    if (isFirstLoad) {
      gallery.page = 1;
    }
    gallery.xRestrict = searchOptions.xRestrict;
    gallery.fetchSource();
  };

  const onLoadMore = () => {
    if (gallery.isPopPreview) return;
    if (gallery.errorTimes > 1) return;
    fetchSource(false);
  };

  const refreshContent = () => {
    gallery.clearErrorTimes();
    gallery.clearSource();
    layoutRef?.current?.toTop();
    fetchSource(true);
    // window.location.reload();
  };

  const fetchTags = () => {
    if (gallery.tags.length === 0) {
      gallery.fetchTags();
    }
  };

  const onSearch = (word: string) => {
    if (!word) {
      return;
    }
    if (!isNaN(parseFloat(word)) && isFinite(Number(word))) {
      history.push(`/illust/${word}`);
    } else {
      Storage.set('word', word);
      gallery.clearErrorTimes();
      gallery.clearSource();
      gallery.setWord(word);
      layoutRef?.current?.toTop();
      fetchSource(true);
    }
  };

  const onSearchOptionsChange = (options: SearchOptions) => {
    Storage.set('x_restrict', options.xRestrict);
    setSearchOptions(options);
  };

  const onKeywordClick = (word: string) => {
    gallery.setWord(word);
    if (word !== 'ranking') {
      inputRef.current?.setValue(word);
    } else {
      inputRef.current?.setValue('');
    }
    refreshContent();
    Storage.set('word', word);
  };

  useMount(() => {
    // if (!api.getAuth()) {
    //   setShouldLogin(true);
    //   loginRef.current?.open(() => {
    //     window.location.reload();
    //   });
    //   return;
    // }
    // setShouldLogin(false);

    const word = Storage.get('word');
    if (word && word !== 'ranking') {
      inputRef.current?.setValue(word);
    }

    if (gallery.fromIllust) {
      onSearch(gallery.word);
      gallery.setFromIllust(false);
    } else {
      const search = new URLSearchParams(location.search);
      if (search.get('entry') === 'ranking') {
        gallery.setWord('ranking');
        Storage.set('word', 'ranking');
      } else {
        const cachedWord = Storage.get('word');
        gallery.setWord(cachedWord ? cachedWord : 'ranking');
      }
      if (gallery.items.length === 0) {
        fetchSource(true);
      }
      fetchTags();
    }
  });

  const renderKeywords = () => {
    const keywords = [...gallery.tags];
    keywords.unshift({ tag: 'ranking' });

    if (gallery.isFetchingTags) {
      return <Loading />;
    }

    const word = String(gallery.word);
    let found = false;
    for (const item of keywords) {
      if (item.tag === word) {
        found = true;
        break;
      }
    }

    return (
      <>
        {!found && word !== 'ranking' && word.trim() !== '' && (
          <ListItem button onClick={() => onKeywordClick(word)}>
            <ListItemIcon>
              <DoneIcon style={{ color: '#4caf50' }} />
            </ListItemIcon>
            <ListItemText style={{ fontWeight: 'bold' }} primary={word} />
          </ListItem>
        )}
        {keywords.map(elem => {
          const ranking = elem.tag === 'ranking';
          const highlight =
            elem.tag === gallery.word ||
            (gallery.word === 'ranking' && ranking);
          const tagName = elem.translated_name
            ? ` (${elem.translated_name})`
            : '';

          return (
            <ListItem
              key={elem.tag}
              button
              onClick={() => onKeywordClick(ranking ? 'ranking' : elem.tag)}>
              {highlight && (
                <ListItemIcon>
                  <DoneIcon style={{ color: '#4caf50' }} />
                </ListItemIcon>
              )}
              <ListItemText
                style={{ fontWeight: 'bold' }}
                primary={
                  ranking
                    ? intl.formatMessage({ id: 'Ranking' })
                    : elem.tag + tagName
                }
              />
            </ListItem>
          );
        })}
      </>
    );
  };

  const onToggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const [usersIriTag, setUsersIriTag] = React.useState(gallery.usersIriTag);
  const [rankMode, setRankMode] = React.useState(gallery.rankMode);
  const [rankDate, setRankDate] = React.useState(gallery.rankDate);
  const [isPopPreview, setIsPopPreview] = React.useState(gallery.isPopPreview);

  const handleUsersIriChange = (event: SelectChangeEvent) => {
    gallery.usersIriTag = event.target.value;
    setUsersIriTag(event.target.value);
    refreshContent();
  };
  const handleRankModeChange = (event: SelectChangeEvent) => {
    gallery.rankMode = event.target.value;
    setRankMode(event.target.value);
    refreshContent();
  };
  const handleRankDateChange = (val: any) => {
    gallery.rankDate = val.format('YYYY-MM-DD');
    setRankDate(gallery.rankDate);
    refreshContent();
  };
  const handlePopChange = (event: any) => {
    gallery.isPopPreview = event.target.checked;
    setIsPopPreview(event.target.checked);
    refreshContent();
  };

  return useObserver(() => (
    <LayoutContainer
      ref={layoutRef}
      title={config.siteTitle}
      menuRender={() => (
        <IconButton
          color="inherit"
          onClick={onToggleDrawer}
          aria-label="Menu"
          size="large">
          <MenuIcon />
        </IconButton>
      )}
      extraRender={() => (
        <>
          {gallery.word !== 'ranking' && (
            <FormControl
              sx={{
                minWidth: 100,
                marginRight: 2,
                color: '#fff',
                '& .MuiSelect-select, & .MuiSelect-icon ': { color: '#fff' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' }
              }}
              size="small">
              <InputLabel id="usersiri-select-label" sx={{ color: '#fff' }}>
                users入り
              </InputLabel>
              <Select
                labelId="usersiri-select-label"
                id="usersiri-select"
                value={usersIriTag}
                label="users入り"
                onChange={handleUsersIriChange}>
                <MenuItem value={'30000users入り'}>30000users入り</MenuItem>
                <MenuItem value={'20000users入り'}>20000users入り</MenuItem>
                <MenuItem value={'10000users入り'}>10000users入り</MenuItem>
                <MenuItem value={'7500users入り'}>7500users入り</MenuItem>
                <MenuItem value={'5000users入り'}>5000users入り</MenuItem>
                <MenuItem value={'1000users入り'}>1000users入り</MenuItem>
                <MenuItem value={'500users入り'}>500users入り</MenuItem>
                <MenuItem value={'250users入り'}>250users入り</MenuItem>
                <MenuItem value={'100users入り'}>100users入り</MenuItem>
              </Select>
            </FormControl>
          )}
          <SearchInput
            ref={inputRef}
            onSearch={onSearch}
            onOptionsChange={onSearchOptionsChange}
            searchOptions={searchOptions}
          />
          {gallery.word !== 'ranking' && (
            <FormControlLabel
              label="热门预览"
              control={
                <Switch
                  color="secondary"
                  checked={isPopPreview}
                  onChange={handlePopChange}
                />
              }
            />
          )}
        </>
      )}
      scroll={{
        infinite: true,
        distance: 200,
        onLoadMore,
        isLoading: gallery.isFetching,
        hasMore: true
      }}>
      {shouldLogin ? (
        <Message
          code={403}
          text={intl.formatMessage({
            id: 'Please sign in to continue'
          })}
        />
      ) : (
        <div className={classes.root}>
          {gallery.word === 'ranking' && (
            <Box sx={{ mt: 2 }} display={'flex'} justifyContent={'center'}>
              <FormControl sx={{ minWidth: 100, mr: 1 }} size="small">
                <Select value={rankMode} onChange={handleRankModeChange}>
                  <MenuItem value={'day'}>日榜</MenuItem>
                  <MenuItem value={'week'}>周榜</MenuItem>
                  <MenuItem value={'month'}>月榜</MenuItem>
                  <MenuItem value={'day_male'}>男性向</MenuItem>
                  <MenuItem value={'day_female'}>女性向</MenuItem>
                  <MenuItem value={'week_original'}>原创</MenuItem>
                  <MenuItem value={'week_rookie'}>新人</MenuItem>
                  <MenuItem value={'day_ai'}>AI</MenuItem>
                  <MenuItem value={'day_r18'}>R18 日</MenuItem>
                  <MenuItem value={'day_male_r18'}>R18 男</MenuItem>
                  <MenuItem value={'day_female_r18'}>R18 女</MenuItem>
                  <MenuItem value={'week_r18'}>R18 周</MenuItem>
                  <MenuItem value={'week_r18g'}>R18G 周</MenuItem>
                  <MenuItem value={'day_r18_ai'}>R18 AI</MenuItem>
                </Select>
              </FormControl>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={rankDate}
                  onChange={handleRankDateChange}
                  renderInput={params => <TextField {...params} size="small" />}
                />
              </LocalizationProvider>
            </Box>
          )}
          {gallery.items.length === 0 && gallery.isFetching && <Loading />}
          <GalleryList items={gallery.items} />
          {gallery.items.length > 0 && gallery.isFetching && <Loading />}
          {/* {gallery.isError && (
            <>
              <Message
                text={
                  gallery.errorMsg
                    ? gallery.errorMsg
                    : intl.formatMessage({ id: 'Failed to Load' })
                }
              />
              <div className={classes.refreshBtn}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<CachedIcon />}
                  onClick={() => window.location.reload()}>
                  {intl.formatMessage({ id: 'Refresh page' })}
                </Button>
              </div>
            </>
          )} */}
          {/* <Refresh onClick={refreshContent} /> */}
        </div>
      )}
      <Drawer open={isDrawerOpen} onClose={onToggleDrawer}>
        <div
          tabIndex={0}
          role="button"
          style={{ minWidth: 200 }}
          onClick={onToggleDrawer}
          onKeyDown={onToggleDrawer}>
          <List
            subheader={
              <ListSubheader disableSticky>
                {intl.formatMessage({ id: 'Tags' })}
              </ListSubheader>
            }>
            {renderKeywords()}
          </List>
        </div>
      </Drawer>
    </LayoutContainer>
  ));
};

export default Gallery;
