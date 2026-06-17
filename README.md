# Dolt `JSON_LENGTH` Bug Reproduction

> Dolt's `JSON_LENGTH('[]')` returns `NULL` instead of `0` (MySQL returns `0`).

## Running

Requires a running Dolt SQL Server on `localhost:3306`:

```bash
docker run -d -p 3306:3306 dolthub/dolt-sql-server:latest
bun install
bun test
```

## Expected vs Actual

| Expression | MySQL | Dolt |
|---|---|---|
| `JSON_LENGTH('[]')` | `0` | `NULL` |
| `JSON_LENGTH('{}')` | `0` | `NULL` |
| `JSON_LENGTH('[1,2,3]')` | `3` | `3` |
| `JSON_LENGTH('"string"')` | `1` | `1` |
| `JSON_LENGTH(NULL)` | `NULL` | `NULL` |
