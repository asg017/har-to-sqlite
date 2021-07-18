// deno-lint-ignore-file camelcase

import { DB, QueryParam } from "https://deno.land/x/sqlite@v2.4.2/mod.ts";
import { HAR } from "./types.ts";

export interface ArchiveRow {
  name?: string;
  version: string;
  creator_name: string;
  creator_version: string;
  browser_name: string;
  browser_version: string;
}
export interface PageRow {
  archive: number;
  started: string;
  id: string;
  title: string;
  timing_contentload: number;
  timing_load: number;
}

export interface EntryRow {
  page: number;
  started: string;

  request_method: string;
  request_url: string;
  request_headers: string;
  request_headers_obj: string;
  request_cookies: string;
  request_cookies_obj: string;
  request_querystring: string;
  request_querystring_obj: string;
  request_body_size: number;
  request_headers_size: number;
  request_postdata_params?: string;
  request_postdata_mimetype?: string;
  request_postdata_params_obj?: string;
  request_postdata_text?: string;
  request_postdata_comment?: string;

  response_status: number;
  response_status_text: string;
  response_http_version: string;
  response_headers: string;
  response_headers_obj: string;
  response_cookies: string;
  response_cookies_obj: string;
  response_redirect_url: string;
  response_headers_size: number;
  response_body_size: number;
  response_content_mimetype: string;
  response_content_size: number;
  response_content: Uint8Array;

  timings_blocked: number;
  timings_dns: number;
  timings_connect: number;
  timings_ssl: number;
  timings_send: number;
  timings_wait: number;
  timings_receive: number;

  server_ip_address: string;
  connection: string;
}

export function fillDb(db: DB, data: HAR, name?: string) {
  const archive = insertArchive(db, data, name);
  const pages = insertPages(db, data, archive);
  insertEntries(db, data, pages);
}

export function insertArchive(db: DB, data: HAR, name?: string): number {
  const row: ArchiveRow = {
    name,
    version: data.log.version,
    creator_name: data.log.creator.name,
    creator_version: data.log.creator.version,
    browser_name: data.log.browser.name,
    browser_version: data.log.browser.version,
  };
  db.query(
    `
    INSERT INTO archives
      ( name, version, creator_name, creator_version, browser_name, browser_version)
    VALUES
      (:name,:version,:creator_name,:creator_version,:browser_name,:browser_version)
  `,
    row as unknown as Record<string, QueryParam>
  );
  return db.lastInsertRowId;
}

export function insertPages(
  db: DB,
  data: HAR,
  archive: number
): Map<string, number> {
  const pages: Map<string, number> = new Map();
  const rows: PageRow[] = data.log.pages.map((page) => ({
    archive,
    started: page.startedDateTime,
    id: page.id,
    title: page.title,
    timing_contentload: page.pageTimings.onContentLoad,
    timing_load: page.pageTimings.onLoad,
  }));
  for (const row of rows) {
    db.query(
      `
      INSERT INTO pages
        ( archive, started, id, title, timing_contentload, timing_load)
      VALUES
        (:archive,:started,:id,:title,:timing_contentload,:timing_load)
    `,
      row as unknown as Record<string, QueryParam>
    );
    pages.set(row.id, db.lastInsertRowId);
  }
  return pages;
}

export function insertEntries(db: DB, data: HAR, pages: Map<string, number>) {
  for (const entry of data.log.entries) {
    const page = pages.get(entry.pageref);
    if (!page) {
      console.error(pages);
      throw Error(`No page found for ${entry.pageref}`);
    }
    const row: EntryRow = {
      page,
      started: entry.startedDateTime,

      request_method: entry.request.method,
      request_url: entry.request.url,
      request_headers: JSON.stringify(entry.request.headers),
      request_headers_obj: JSON.stringify(
        Object.fromEntries(entry.request.headers.map((d) => [d.name, d.value]))
      ),
      request_cookies: JSON.stringify(entry.request.cookies),
      request_cookies_obj: JSON.stringify(
        Object.fromEntries(entry.request.cookies.map((d) => [d.name, d.value]))
      ),
      request_querystring: JSON.stringify(entry.request.queryString),
      request_querystring_obj: JSON.stringify(
        Object.fromEntries(
          entry.request.queryString.map((d) => [d.name, d.value])
        )
      ),
      request_body_size: entry.request.bodySize,
      request_headers_size: entry.request.headersSize,
      request_postdata_mimetype: entry.request.postData?.mimeType,
      request_postdata_params: entry.request.postData?.params
        ? JSON.stringify(entry.request.postData?.params)
        : undefined,
      request_postdata_params_obj: entry.request.postData?.params
        ? JSON.stringify(
            Object.fromEntries(
              entry.request.postData.params.map((param) => [
                param.name,
                param.value,
              ])
            )
          )
        : undefined,
      request_postdata_text: entry.request.postData?.text,
      request_postdata_comment: entry.request.postData?.comment,

      response_status: entry.response.status,
      response_status_text: entry.response.statusText,
      response_http_version: entry.response.httpVersion,
      response_headers: JSON.stringify(entry.response.headers),
      response_headers_obj: JSON.stringify(
        Object.fromEntries(entry.response.headers.map((d) => [d.name, d.value]))
      ),
      response_cookies: JSON.stringify(entry.response.cookies),
      response_cookies_obj: JSON.stringify(
        Object.fromEntries(entry.response.cookies.map((d) => [d.name, d.value]))
      ),
      response_redirect_url: entry.response.redirectURL,
      response_headers_size: entry.response.headersSize,
      response_body_size: entry.response.bodySize,

      response_content_mimetype: entry.response.content.mimeType,
      response_content_size: entry.response.content.size,
      response_content:
        entry.response.content.encoding === "base64" &&
        entry.response.content.text
          ? Uint8Array.from(atob(entry.response.content.text), (c) =>
              c.charCodeAt(0)
            )
          : new Uint8Array(
              new TextEncoder().encode(entry.response.content.text)
            ),
      timings_blocked: entry.timings.blocked,
      timings_dns: entry.timings.dns,
      timings_connect: entry.timings.connect,
      timings_ssl: entry.timings.ssl,
      timings_send: entry.timings.send,
      timings_wait: entry.timings.wait,
      timings_receive: entry.timings.receive,
      server_ip_address: entry.serverIPAddress,
      connection: entry.connection,
    };
    db.query(
      `
      INSERT INTO entries
        ( page, started, request_method, request_url, request_headers, request_headers_obj, request_cookies, request_cookies_obj, request_querystring, request_querystring_obj, request_body_size, request_headers_size, request_postdata_mimetype, request_postdata_params, request_postdata_params_obj, request_postdata_text, request_postdata_comment, response_status, response_status_text, response_http_version, response_headers, response_headers_obj, response_cookies, response_cookies_obj, response_redirect_url, response_headers_size, response_body_size, response_content_mimetype, response_content_size, response_content, timings_blocked, timings_dns, timings_connect, timings_ssl, timings_send, timings_wait, timings_receive, server_ip_address, connection)
      VALUES
        (:page,:started,:request_method,:request_url,:request_headers,:request_headers_obj,:request_cookies,:request_cookies_obj,:request_querystring,:request_querystring_obj,:request_body_size,:request_headers_size,:request_postdata_mimetype,:request_postdata_params,:request_postdata_params_obj,:request_postdata_text,:request_postdata_comment,:response_status,:response_status_text,:response_http_version,:response_headers,:response_headers_obj,:response_cookies,:response_cookies_obj,:response_redirect_url,:response_headers_size,:response_body_size,:response_content_mimetype,:response_content_size,:response_content,:timings_blocked,:timings_dns,:timings_connect,:timings_ssl,:timings_send,:timings_wait,:timings_receive,:server_ip_address,:connection)
    `,
      row as unknown as Record<string, QueryParam>
    );
  }
}

export function initHarDB(db: DB) {
  db.query(`
CREATE TABLE IF NOT EXISTS archives (
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  version TEXT,
  creator_name TEXT,
  creator_version TEXT,
  browser_name TEXT,
  browser_version TEXT
);`);
  db.query(`
CREATE TABLE IF NOT EXISTS pages (
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  archive INTEGER,
  started TEXT,
  id TEXT,
  title TEXT,
  timing_contentload INTEGER,
  timing_load INTEGER,
  FOREIGN KEY (archive) REFERENCES archives(rowid)
);`);

  db.query(`
CREATE TABLE IF NOT EXISTS entries (
 page INTEGER,
 started TEXT,

 -- request
 request_method TEXT,
 request_url TEXT,
 request_headers TEXT,
 request_headers_obj TEXT,
 request_cookies TEXT,
 request_cookies_obj TEXT,
 request_querystring TEXT,
 request_querystring_obj TEXT,
 request_body_size INTEGER,
 request_headers_size INTEGER,
 request_postdata_mimetype TEXT,
 request_postdata_params TEXT,
 request_postdata_params_obj TEXT,
 request_postdata_text TEXT,
 request_postdata_comment TEXT,

 -- response
 response_status INTEGER,
 response_status_text TEXT,
 response_http_version TEXT,
 response_headers TEXT,
 response_headers_obj TEXT,
 response_cookies TEXT,
 response_cookies_obj TEXT,
 response_redirect_url TEXT,
 response_headers_size INTEGER,
 response_body_size INTEGER,
 response_content_mimetype TEXT,
 response_content_size INTEGER,
 response_content BLOB,

 -- cache

 -- timings
 timings_blocked INTEGER,
 timings_dns INTEGER,
 timings_connect INTEGER,
 timings_ssl INTEGER,
 timings_send INTEGER,
 timings_wait INTEGER,
 timings_receive INTEGER,
 
 server_ip_address TEXT,
 connection TEXT,
 FOREIGN KEY (page) REFERENCES pages(rowid)
);`);
}
