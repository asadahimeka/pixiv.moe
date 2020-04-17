import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Menu, MenuItem, Box, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Language as LanguageIcon,
  ExpandMore as ExpandMoreIcon
} from '@material-ui/icons';
import { useIntl } from 'react-intl';
import shortid from 'shortid';
import config from '@/config';
import Storage from '@/utils/Storage';
import chooseLocale from '@/locale/chooseLocale';
import { ICombinedState } from '@/reducers';

const useStyles = makeStyles({
  language: {
    margin: '0px 4px 0px 8px'
  }
});

const LanguageSelector: React.FunctionComponent<{}> = () => {
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
  const dispatch = useDispatch();
  const classes = useStyles();
  const locale = useSelector((state: ICombinedState) => state.locale);
  const intl = useIntl();

  const lang = locale.lang;

  const onLanguageClick = (value: string) => {
    Storage.set('lang', value);
    chooseLocale(value, dispatch);
  };

  const onMenuOpen = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const onMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button color="inherit" onClick={onMenuOpen}>
        <LanguageIcon />
        <span className={classes.language}>{lang}</span>
        <ExpandMoreIcon fontSize="small" />
      </Button>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        open={Boolean(anchorEl)}
        onClose={onMenuClose}>
        {[
          <MenuItem key={shortid.generate()} disabled>
            {intl.formatMessage({ id: 'Language' })}
          </MenuItem>,
          ...config.languages.map(elem => {
            return (
              <MenuItem
                key={elem.value}
                selected={elem.value === lang}
                onClick={() => {
                  onLanguageClick(elem.value);
                  onMenuClose();
                }}>
                {elem.name}
              </MenuItem>
            );
          }),
          <Box key={shortid.generate()} my={1}>
            <Divider />
          </Box>,
          <MenuItem
            key={shortid.generate()}
            component="a"
            href={config.translateLink}
            target="_blank">
            {intl.formatMessage({ id: 'HelpToTranslate' })}
          </MenuItem>
        ]}
      </Menu>
    </>
  );
};

export default LanguageSelector;
