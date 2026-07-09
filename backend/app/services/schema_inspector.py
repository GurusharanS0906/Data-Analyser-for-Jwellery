from dataclasses import dataclass
from pathlib import Path

import duckdb
from fastapi import HTTPException, status


@dataclass
class TableSchema:
    columns: list[tuple[str, str]]  # (name, duckdb type)
    sample_rows: list[dict]
    row_count: int

    def as_prompt_text(self) -> str:
        column_lines = "\n".join(f'- "{name}" ({dtype})' for name, dtype in self.columns)
        sample_lines = "\n".join(str(row) for row in self.sample_rows)
        return (
            f"Table name: data\n"
            f"Row count: {self.row_count}\n"
            f"Columns:\n{column_lines}\n\n"
            f"Sample rows:\n{sample_lines}"
        )


def open_duckdb(duckdb_path: Path) -> duckdb.DuckDBPyConnection:
    if not duckdb_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This file hasn't been processed yet — try re-uploading it.",
        )
    return duckdb.connect(str(duckdb_path), read_only=True)


def inspect_table(duckdb_path: Path, sample_size: int = 5) -> TableSchema:
    con = open_duckdb(duckdb_path)
    try:
        columns = [
            (row[0], row[1]) for row in con.execute("DESCRIBE data").fetchall()
        ]
        row_count = con.execute("SELECT COUNT(*) FROM data").fetchone()[0]
        sample_df = con.execute(f"SELECT * FROM data LIMIT {sample_size}").fetchdf()
        sample_rows = sample_df.to_dict(orient="records")
        return TableSchema(columns=columns, sample_rows=sample_rows, row_count=row_count)
    finally:
        con.close()
