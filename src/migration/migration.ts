// Copyright 2016 Frank Lin (lin.xiaoe.f@gmail.com). All rights reserved.
// Use of this source code is governed a license that can be found in the LICENSE file.


import * as fs from 'fs';
import * as path from 'path';

import {
  Operation, AddModelOperation, AddColumnOperation, DropColumnOperation,
  RenameColumnOperation, InitCommentOperation
} from './operation';
import {Field} from './column';
import {PgClient} from '../database/pgclient';

/**
 * Migration tool for PostgreSQL.
 *
 * Usage:
 *  let migration = new Migration();
 *  migration.addModel(User); // Adds User's table.
 *  migration.migrate(); // migrate database.
 */
export class Migration {
  private operations_: Array<Operation> = [];
  private dependencies_: Array<Migration> = [];

  /**
   * Adds model's table.
   * @param cls Class extends model.
   */
  addModel(cls: Function): void {
    this.operations_.push(new AddModelOperation(cls));
    this.operations_.push(new InitCommentOperation(cls));
  }
  /**
   * Adds column to existing table.
   * @param cls Class extends model.
   * @param column New column.
   */
  addColumn(cls: Function, column: Field): void {
    this.operations_.push(new AddColumnOperation(cls, column));
  }

  /**
   * Drops column from existing table.
   * @param cls Class extends model.
   * @param columnName Column name.
   */
  dropColumn(cls: Function, columnName: string): void {
    this.operations_.push(new DropColumnOperation(cls, columnName));
  }

  /**
   * Renames column in existing table.
   * @param cls Class extends model.
   * @param oldName Old name.
   * @param newName New name.
   */
  renameColumn(cls: Function, oldName: string, newName: string): void {
    this.operations_.push(new RenameColumnOperation(cls, oldName, newName));
  }

  /**
   * Adds dependency in order, dependency is another migration.
   * @param dependency Previous version migration.
   */
  addDependency(dependency: Migration): void {
    this.dependencies_.push(dependency);
  }

  /**
   * Use dependency array as dependencies.
   * @param dependencies All previous migrations.
   */
  setDependencies(dependencies: Migration[]): void {
    this.dependencies_ = dependencies;
  }

  /**
   * Generates SQL to migrate.
   * @returns {string} SQL.
   */
  preview(): string {
    let sql: string = '';

    for (let i = 0; i < this.operations_.length; i++) {
      let operation: Operation = this.operations_[i];
      sql += operation.sql();

      if (i !== this.operations_.length - 1) {
        sql += '\n';
      }
    }

    return sql;
  }

  save(path: string = 'sql/migration.sql'): void {
    const sql: string = this.preview();
    fs.writeFile(path, sql);

  }


  /**
   * Executes migrate sql commands, it is highly recommended to use preview() to see sql before use this method.
   */
  migrate(setupEnv: boolean = false): void {
    let pgClient: PgClient = undefined;

    if (PgClient.getInstance()) {
      pgClient = PgClient.getInstance();
    } else {
      throw new Error('UNDEFINED_PG_CLIENT_SHARED_INSTANCE');
    }

    // run dependencies
    for (let dependency of this.dependencies_) {
      dependency.migrate();
    }

    // run operations
    let sqls: Array<string> = [];

    // create necessary functions
    if (setupEnv) {
      let setupEnvSql: string = fs.readFileSync(path.resolve('sql/setup_pg.sql'), 'utf8') + '\n';
      sqls.push(setupEnvSql);
    }

    for (let operation of this.operations_) {
      sqls.push(operation.sql());
    }

    pgClient.queryInTransaction(sqls);
  }
}
