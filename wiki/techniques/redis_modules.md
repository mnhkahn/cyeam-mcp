---
title: Redis Modules
type: techniques
created: 2018-05-30
last_updated: 2018-05-30
related: ["[[Redis Data Structures]]", "[[Go Data Structures]]", "[[Hash Functions]]"]
sources: ["4fe6505463b4"]
---

# Redis Modules

Redis 4.0 introduced a module API that allows developers to extend Redis with custom commands and data types by loading dynamic shared libraries at startup. In May 2018, the subject explored writing Redis modules in Go using the `go-rm` binding.

## C Module Basics

A Redis module written in C must export `RedisModule_OnLoad`, which registers the module, defines commands, and optionally registers custom data types. Key steps include:

1. **Initialize the module** with `RedisModule_Init`.
2. **Register commands** with `RedisModule_CreateCommand`.
3. **Open keys** with `RedisModule_OpenKey` to read or write values.
4. **Reply to clients** using functions such as `RedisModule_ReplyWithString`, `RedisModule_ReplyWithError`, or `RedisModule_ReplyWithNull`.

Custom data types require a 9-character type name and a method table for persistence (RDB save/load) and other lifecycle operations.

## Go Modules with go-rm

The `go-rm` package provides Go bindings that mirror the C API. A module is defined as a `rm.Module` struct containing metadata and a slice of commands:

```go
func CreateMyMod() *rm.Module {
    mod := rm.NewMod()
    mod.Name = "json"
    mod.Version = 1
    mod.Commands = []rm.Command{
        CreateCommand_ECHO(),
        CreateCommand_JSONSET(),
        CreateCommand_JSONGET(),
    }
    return mod
}
```

### Echo Command Example

```go
func CreateCommand_ECHO() rm.Command {
    return rm.Command{
        Name:     "print",
        Usage:    "print message",
        Desc:     "like echo",
        FirstKey: 1, LastKey: 1, KeyStep: 1,
        Action: func(cmd rm.CmdContext) int {
            ctx, args := cmd.Ctx, cmd.Args
            if len(args) != 2 {
                return ctx.WrongArity()
            }
            ctx.ReplyWithString(args[1])
            return rm.OK
        },
    }
}
```

### JSON Set Command

The subject implemented a command that stores a JSON object as a `map[string]interface{}` inside a custom module type:

```go
func CreateCommand_JSONSET() rm.Command {
    return rm.Command{
        Name:     "json.set",
        Usage:    `json.set a {"foo":"bar"}`,
        Desc:     "store a json object",
        FirstKey: 1, LastKey: 1, KeyStep: 1,
        Action: func(cmd rm.CmdContext) int {
            ctx, args := cmd.Ctx, cmd.Args
            if len(args) != 3 {
                return ctx.WrongArity()
            }
            ctx.AutoMemory()
            key, ok := openHashKey(ctx, args[1])
            if !ok {
                return rm.ERR
            }
            val := &JsonData{Name: args[1], data: make(map[string]interface{})}
            if err := json.Unmarshal([]byte(args[2].String()), &val.data); err != nil {
                ctx.ReplyWithError(fmt.Sprintf("ERR %v", err))
                return rm.ERR
            }
            if key.IsEmpty() {
                key.ModuleTypeSetValue(ModuleType, unsafe.Pointer(val))
            } else {
                old := (*JsonData)(key.ModuleTypeGetValue())
                old.data = val.data
            }
            ctx.ReplyWithString(args[2])
            return rm.OK
        },
    }
}
```

### JSON Get Command

The corresponding get command retrieves either the entire JSON object or a subset of fields:

```go
func CreateCommand_JSONGET() rm.Command {
    return rm.Command{
        Name:     "json.get",
        Usage:    `json.get a foo`,
        Desc:     "get a json object",
        FirstKey: 1, LastKey: 1, KeyStep: 1,
        Action: func(cmd rm.CmdContext) int {
            ctx, args := cmd.Ctx, cmd.Args
            if len(args) < 2 {
                return ctx.WrongArity()
            }
            key, ok := openHashKey(ctx, args[1])
            if !ok {
                return rm.ERR
            }
            val := (*JsonData)(key.ModuleTypeGetValue())
            if val == nil || val.data == nil {
                ctx.ReplyWithNull()
                return rm.OK
            }
            resMap := make(map[string]interface{})
            if len(args) == 2 {
                for k, v := range val.data {
                    resMap[k] = v
                }
            } else {
                for _, arg := range args[2:] {
                    if v, exists := val.data[arg.String()]; exists {
                        resMap[arg.String()] = v
                    }
                }
            }
            res, _ := json.Marshal(resMap)
            ctx.ReplyWithSimpleString(string(res))
            return rm.OK
        },
    }
}
```

## Loading a Module

After compiling the module to a shared object (`.so`), load it when starting the Redis server:

```bash
./redis-server --loadmodule /path/to/module.so --loglevel debug --port 6340
```

The subject noted that Redis modules inherit Redis's replication, persistence, and clustering capabilities, making it possible to build distributed applications on top of Redis with minimal additional infrastructure.
