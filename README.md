# har-to-sqlite

Load a [HAR](<https://en.wikipedia.org/wiki/HAR_(file_format)>) (HTTP Archive Format) file into a SQLite database.

## Install

`har-to-sqlite` depends on [Deno](https://deno.land/). Install with:

```bash
deno install --allow-read --allow-write -n har-to-sqlite https://deno.land/har_to_sqlite@0.0.1/cli.ts

```

## Usage

```
$ har-to-sqlite input1.har archived.db
$ har-to-sqlite input2.har input3.har input4.har archived.db
$ har-to-sqlite inputs/*.har archived.db

$ har-to-sqlite -n "Wiki #1" input.har wiki-scrape.db
```

## API Reference

## JS API

There is a JS API, I don't feel like documenting it, see usage in `cli.ts`.

### Generated Tables

`har-to-sqlite` creates a few tables to store information: `archives`, `pages`, and `entries`. Every `.har` file is a single row in `archives`. Each archive has several "pages", where every page is a single row in `pages` (found in `.log.pages` in the underlying JSON object). Every page has several "entries", where every entry is one network request captured by the archive (found in `.log.entries`), and every entry has a single row in `.entries`. `har-to-sqlite` will generate these tables in the given `.db` file with the following schemas.

#### `archives`

| Column name       | Type                                | Description                                                               |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `rowid`           | `INTEGER PRIMARY KEY AUTOINCREMENT` | -                                                                         |
| `name`            | `TEXT`                              | Optional name given to the archive, usually with the `--name`/`-n` flags. |
| `version`         | `TEXT`                              | `.log.version`                                                            |
| `creator_name`    | `TEXT`                              | `.log.creator.name`                                                       |
| `creator_version` | `TEXT`                              | `.log.creator.version`                                                    |
| `browser_name`    | `TEXT`                              | `.log.browser.name`                                                       |
| `browser_version` | `TEXT`                              | `.log.browser.version`                                                    |

### `pages`

| Column name          | Type                                | Description                                                   |
| -------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `rowid`              | `INTEGER PRIMARY KEY AUTOINCREMENT` | -                                                             |
| `archive`            | `INTEGER`                           | Foreign key to `archives.rowid` to which the page belongs to. |
| `started`            | `TEXT`                              | `.log.pages[<N>].started`                                     |
| `id`                 | `TEXT`                              | `.log.pages[<N>].id`                                          |
| `title`              | `TEXT`                              | `.log.pages[<N>].title`                                       |
| `timing_contentload` | `INTEGER`                           | `.log.pages[<N>].pageTimings.onContentLoad`                   |
| `timing_load`        | `INTEGER`                           | `.log.pages[<N>].pageTimings.onLoad`                          |

### `entries`

| Column name                   | Type      | Description                                                                                                                                 |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`                        | `INTEGER` | Foreign key to `pages.rowid` to which the entry belongs to.                                                                                 |
| `started`                     | `TEXT`    | `.log.entries[<N>].startedDateTime`                                                                                                         |
| `request_method`              | `TEXT`    | `.log.entries[<N>].request.method`                                                                                                          |
| `request_url`                 | `TEXT`    | `.log.entries[<N>].request.url`                                                                                                             |
| `request_headers`             | `TEXT`    | `.log.entries[<N>].request.headers` (raw JSON array )                                                                                       |
| `request_headers_obj`         | `TEXT`    | `.log.entries[<N>].request.headers` (JSON object, where the keys are ".name" and the values ".value". This may override legitmate headers.) |
| `request_cookies`             | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `request_cookies_obj`         | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `request_querystring`         | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `request_querystring_obj`     | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `request_body_size`           | `INTEGER` | `.log.entries[<N>].request.bodySize`                                                                                                        |
| `request_headers_size`        | `INTEGER` | `.log.entries[<N>].request.headersSize`                                                                                                     |
| `request_postdata_mimetype`   | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `request_postdata_params`     | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `request_postdata_params_obj` | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `request_postdata_text`       | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `request_postdata_comment`    | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `response_status`             | `INTEGER` | `.log.entries[<N>].response.status`                                                                                                         |
| `response_status_text`        | `TEXT`    | `.log.entries[<N>].response.statusText`                                                                                                     |
| `response_http_version`       | `TEXT`    | `.log.entries[<N>].response.httpVersion`                                                                                                    |
| `response_headers`            | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `response_headers_obj`        | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `response_cookies`            | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `response_cookies_obj`        | `TEXT`    | `.log.entries[<N>].`                                                                                                                        |
| `response_redirect_url`       | `TEXT`    | `.log.entries[<N>].response.redirectURL`                                                                                                    |
| `response_headers_size`       | `INTEGER` | `.log.entries[<N>].response.headersSize`                                                                                                    |
| `response_body_size`          | `INTEGER` | `.log.entries[<N>].response.bodySize`                                                                                                       |
| `response_content_mimetype`   | `TEXT`    | `.log.entries[<N>].response.content.mimeType`                                                                                               |
| `response_content_size`       | `INTEGER` | `.log.entries[<N>].response.content.size`                                                                                                   |
| `response_content`            | `BLOB`    | A binary BLOB of `.log.entries[<N>].response.content.text`, encoded based on `.log.entries[<N>].response.content.encoding`                  |
| `timings_blocked`             | `INTEGER` | `.log.entries[<N>].timings.blocked`                                                                                                         |
| `timings_dns`                 | `INTEGER` | `.log.entries[<N>].timings.dns`                                                                                                             |
| `timings_connect`             | `INTEGER` | `.log.entries[<N>].timings.connect`                                                                                                         |
| `timings_ssl`                 | `INTEGER` | `.log.entries[<N>].timings.ssl`                                                                                                             |
| `timings_send`                | `INTEGER` | `.log.entries[<N>].timings.send`                                                                                                            |
| `timings_wait`                | `INTEGER` | `.log.entries[<N>].timings.wait`                                                                                                            |
| `timings_receive`             | `INTEGER` | `.log.entries[<N>].timings.receive`                                                                                                         |
| `server_ip_address`           | `TEXT`    | `.log.entries[<N>].serverIPAddress`                                                                                                         |
| `connection`                  | `TEXT`    | `.log.entries[<N>].connection`                                                                                                              |

## Common Recipes

Write all MP4s found in a generated HAR sqlite db onto the disk as `[rowid].db`.

```
sqlite3 output.db "select writefile(rowid || '.mp4', response_content) from entries where response_mimetype = 'video/mp4';"
```

## TODO

- [ ] entries cache
- [ ] fix globbing (deno globs don't like regex-compatible filepaths)
- [ ] Automated tests
