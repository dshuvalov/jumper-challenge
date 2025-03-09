'use client';

import { Box, Typography, useMediaQuery } from '@mui/material';
import { useAccount } from 'wagmi';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Divider, Stack, TextField, Button } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LOAD_MORE_DATA_NAME, TokenData, TokensTable } from '@/components/TokensTable/TokensTable';
import { useAuthenticationStatus } from '@/components/AuthenticationContext/AuthenticationContext';
import { isAddress } from 'viem';
import { getWalletTokens } from '@/app/api/getWalletTokens';
import { notifications } from '@/components/GlobalComponents';

export default function Home() {
  const { address } = useAccount();

  const authStatus = useAuthenticationStatus();
  const isAuthenticated = authStatus === 'authenticated';

  /**
   * Input value, buttons and their handlers
   */
  const [inputValue, setInputValue] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isInputValueInvalid, setIsInputValueInvalid] = useState(false);
  const validateAddress = (value: string) => {
    return isAddress(value);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsInputValueInvalid(false);
    setInputValue(e.target.value);
  };
  const handleInputBlur = () => {
    const isAddressValid = validateAddress(inputValue);

    setIsInputValueInvalid(!isAddressValid);
  };
  const handleSearch = () => {
    const isAddressValid = validateAddress(inputValue);

    if (isAddressValid) {
      setWalletAddress(inputValue);
      setRows([]);
      handleLoadTokens(inputValue);
    } else {
      setIsInputValueInvalid(true);
    }
  };
  const handlerClear = useCallback(() => {
    setInputValue('');
    setWalletAddress(null);
  }, []);

  /**
   * Loading tokens logic
   */
  const [rows, setRows] = useState<TokenData[]>([]);
  // const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const tokensPageKeyRef = useRef<string>('');

  const handleLoadTokens = useCallback(async (walletAddressArg: string) => {
    if (!validateAddress(walletAddressArg) || loadingRef.current) {
      return;
    }
    loadingRef.current = true;

    const response = await getWalletTokens(walletAddressArg, { tokensPageKey: tokensPageKeyRef.current });

    const tokensPageKey = response.tokensPageKey;
    const tokensPageKeyExisted = Boolean(tokensPageKey);
    if (tokensPageKeyExisted) {
      tokensPageKeyRef.current = tokensPageKey!;
    }

    setRows((prev) => {
      const loadMoreInPrevExisted = prev[prev.length - 1]?.name === LOAD_MORE_DATA_NAME;
      const prevModified = loadMoreInPrevExisted ? prev.slice(0, -1) : prev;

      const newRows: TokenData[] = [...prevModified, ...response.tokens];

      if (tokensPageKeyExisted) {
        newRows.push({ name: LOAD_MORE_DATA_NAME, balance: '', symbol: '' });
      }

      return newRows;
    });
    loadingRef.current = false;
  }, []);

  const userTokensFetchedRef = useRef(false);
  useEffect(
    function fetchUserAssets() {
      if (isAuthenticated && !userTokensFetchedRef.current && address) {
        setInputValue(address);
        setWalletAddress(address);
        handleLoadTokens(address);
        userTokensFetchedRef.current = true;
      }

      if (!isAuthenticated) {
        setRows([]);
        setInputValue('');
        setWalletAddress(null);
        userTokensFetchedRef.current = false;
      }
    },
    [address, handleLoadTokens, isAuthenticated]
  );

  /**
   * Buttons disabled state
   */
  const buttonDisabled = !isAuthenticated || inputValue.length === 0;
  const submitButtonDisabled = buttonDisabled || inputValue === walletAddress;
  const clearButtonDisabled = buttonDisabled;

  const handleLoadMore = useCallback(
    (walletAddress: string | null) => () => {
      if (walletAddress === null || walletAddress.length === 0) {
        notifications.show('Please fill the wallet address and click Search', {
          severity: 'error',
          autoHideDuration: 5000,
        });
        return;
      }
      handleLoadTokens(walletAddress);
    },
    [handleLoadTokens]
  );

  const tabletAndDown = useMediaQuery('(max-width: 900px)');

  return (
    <Box display="flex" alignItems="center" flexDirection="column" justifyContent="center">
      <Typography variant="h1">ERC-20 tokens explorer</Typography>
      <Stack spacing={2} width="100%" sx={{ marginTop: '24px' }}>
        <Stack direction={tabletAndDown ? 'column' : 'row'} spacing={2} alignItems="center">
          <ConnectButton />

          <Divider orientation={tabletAndDown ? 'horizontal' : 'vertical'} flexItem />
          <Stack spacing={1}>
            <TextField
              sx={{ width: tabletAndDown ? '100%' : '400px' }}
              size="small"
              disabled={!isAuthenticated || loadingRef.current}
              label={isAuthenticated ? 'Wallet Address' : 'Connect wallet first'}
              value={inputValue}
              error={isInputValueInvalid}
              helperText={isInputValueInvalid ? 'Incorrect wallet address' : ' '}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disabled={submitButtonDisabled}
                loading={loadingRef.current}
                onClick={handleSearch}
              >
                Search
              </Button>
              <Button disabled={clearButtonDisabled} loading={loadingRef.current} onClick={handlerClear}>
                Clear
              </Button>
            </Stack>
          </Stack>
        </Stack>

        <TokensTable data={rows} onLoadMore={handleLoadMore(walletAddress || '')} />
      </Stack>
    </Box>
  );
}
