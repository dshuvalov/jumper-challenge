'use client';

import { forwardRef } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { TableComponents, TableVirtuoso } from 'react-virtuoso';
import { TableContainerProps } from '@mui/material/TableContainer/TableContainer';
import { TableHeadProps } from '@mui/material/TableHead/TableHead';
import { Button, useMediaQuery } from '@mui/material';

export const LOAD_MORE_DATA_NAME = 'load-more';

export interface TokenData {
  name: string;
  balance: string;
  symbol: string;
}

interface ColumnData {
  dataKey: keyof TokenData;
  label: string;
  numeric?: boolean;
  width?: number;
}

const columns: ColumnData[] = [
  {
    width: 50,
    label: 'Token Name',
    dataKey: 'name',
  },
  {
    width: 50,
    label: 'Token Symbol',
    dataKey: 'symbol',
  },
  {
    width: 50,
    label: 'Balance',
    dataKey: 'balance',
    numeric: true,
  },
];

const VirtuosoTableComponents: TableComponents<TokenData> = {
  // eslint-disable-next-line react/display-name
  Scroller: forwardRef<HTMLDivElement, TableContainerProps>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} sx={{ overflowX: 'auto' }} />
  )),
  Table: (props) => <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />,
  // eslint-disable-next-line react/display-name
  TableHead: forwardRef<HTMLTableSectionElement, TableHeadProps>((props, ref) => <TableHead {...props} ref={ref} />),
  TableRow,
  // eslint-disable-next-line react/display-name
  TableBody: forwardRef<HTMLTableSectionElement>((props, ref) => <TableBody {...props} ref={ref} />),
};

function fixedHeaderContent() {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant="head"
          size="small"
          align={column.numeric || false ? 'right' : 'left'}
          style={{ width: column.width }}
          sx={{ backgroundColor: 'background.paper' }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

// eslint-disable-next-line react/display-name
const rowContent = (handleLoadMore: () => void) => (_index: number, row: TokenData) => {
  if (row.name === LOAD_MORE_DATA_NAME) {
    return (
      <TableCell colSpan={columns.length} align="center" variant="body">
        <Button variant="contained" onClick={handleLoadMore}>
          Load More
        </Button>
      </TableCell>
    );
  }
  return (
    <>
      {columns.map((column) => (
        <TableCell key={column.dataKey} align={column.numeric || false ? 'right' : 'left'}>
          {row[column.dataKey]}
        </TableCell>
      ))}
    </>
  );
};

type TokenTableProps = {
  data: TokenData[];
  onLoadMore: () => void;
};

export const TokensTable = (props: TokenTableProps) => {
  const tabletAndDown = useMediaQuery('(max-width: 900px)');
  const height = tabletAndDown ? 'calc(100vh - 290px)' : 'calc(100vh - 210px)';
  return (
    <Paper style={{ height: height, width: '100%' }}>
      <TableVirtuoso
        data={props.data}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={rowContent(props.onLoadMore)}
      />
    </Paper>
  );
};
