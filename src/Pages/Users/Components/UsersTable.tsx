import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Button, CircularProgress, Divider, Typography } from "@mui/material";
import { UserType } from "../../../Types/Types";
import { deActiveUser, reActiveUser } from "../../../Database/database";
import { useAuth } from "../../../Context/AdminContext";
import { useState } from "react";

interface Column {
  id:
    | "isActive"
    | "email"
    | "nickname"
    | "gender"
    | "time_of_register"
    | "current_level"
    | "status";
  label: string;
  minWidth?: number;
  align?: "right";
  format?: (value: number | boolean) => string;
  button?: (
    value: boolean,
    id: string,
    clickHandler: (e: any, id: string, value: boolean) => void
  ) => JSX.Element;
}

type Props = {
  users: UserType[];
  setUsers: React.Dispatch<React.SetStateAction<UserType[]>>;
};
const columns: readonly Column[] = [
  { id: "email", label: "Email", minWidth: 170 },
  { id: "nickname", label: "Nickname", minWidth: 100 },
  {
    id: "gender",
    label: "Gender",
    minWidth: 100,
    format: (value: number | boolean) => (value === 1 ? "Male" : "Female"),
  },
  {
    id: "time_of_register",
    label: "Time Of Register",
    minWidth: 170,
  },
  {
    id: "current_level",
    label: "Current Level",
    minWidth: 100,
  },
  {
    id: "isActive",
    label: "Is Active",
    minWidth: 50,
    format: (value: number | boolean) => (value ? "Active" : "Banned"),
  },
  {
    id: "isActive",
    label: "Change Status",
    minWidth: 50,
    button: (
      value: boolean,
      id: string,
      clickHandler: (e: any, id: string, value: boolean) => void
    ) => (
      <Button
        variant="contained"
        color={value ? "error" : "success"}
        onClick={(e: any) => clickHandler(e, id, value)}
      >
        {value ? "Deactive" : "Reactive"}
      </Button>
    ),
  },
];
const UsersTable: React.FC<Props> = ({ users, setUsers }) => {
  const auth = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleClick = async (e: any, id: string, value: boolean) => {
    e.target.disabled = true;
    e.target.classList.add("Mui-disabled");
    try {
      if (value) {
        await deActiveUser(auth?.token!, id);
      } else {
        await reActiveUser(auth?.token!, id);
      }
      const index = users.findIndex((user) => user._id === id);
      users[index].isActive = !value;
      setUsers([...users]);
    } catch {
      console.log("Error");
    } finally {
      e.target.disabled = false;
      e.target.classList.remove("Mui-disabled");
    }
  };
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <Typography variant="h6" p={2}>
        Registered Users
      </Typography>
      <Divider flexItem />
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index} align={column.align} style={{ minWidth: column.minWidth }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user: any, rowIndex: number) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={rowIndex}>
                    {columns.map((column, index) => {
                      const value = user[column.id];
                      return (
                        <TableCell key={index} align={column.align}>
                          {column.button
                            ? column.button(value, user._id, handleClick)
                            : column.format &&
                              (typeof value === "number" || typeof value === "boolean")
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={users.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};
export default UsersTable;
