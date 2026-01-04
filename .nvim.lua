-- NOTE: Set `vim.opt.exrc = true` in your init.lua to use local config files for each project

local cache_dir = vim.fn.stdpath("cache") .. "/crawl_ls"

--- @type vim.lsp.Config
local crawl_ls_config = {
  cmd = { "deno", "task", "-q", "dev", "--cache-dir", cache_dir },
  filetypes = { "markdown" },
  single_file_support = true,
  on_init = function(client)
    vim.api.nvim_create_user_command("LspCrawlCleanCache", function()
      if vim.fn.isdirectory(cache_dir) == 1 then
        vim.fn.delete(cache_dir, "rf")
        vim.notify("crawl_ls cache deleted: " .. cache_dir, vim.log.levels.INFO)
      else
        vim.notify("crawl_ls cache directory does not exist: " .. cache_dir, vim.log.levels.WARN)
      end
    end, { desc = "Delete crawl_ls LSP cache directory" })

    vim.api.nvim_create_user_command("LspCrawlOpenURL", function(opts)
      local url = opts.args
      if url == "" then
        vim.notify("Usage: LspCrawlOpenURL <url>", vim.log.levels.ERROR)
        return
      end

      local temp_file = vim.fn.tempname() .. ".md"
      vim.fn.writefile({ "[link](" .. url .. ")" }, temp_file)

      local temp_buf = vim.api.nvim_create_buf(false, true)
      vim.api.nvim_buf_set_name(temp_buf, temp_file)

      vim.lsp.buf_attach_client(temp_buf, client.id)
      vim.lsp.buf_request(temp_buf, "textDocument/definition", {
        textDocument = { uri = temp_file },
        position = { line = 0, character = 8 },
      }, function(err, result)
        vim.api.nvim_buf_delete(temp_buf, { force = true })
        if vim.fn.filereadable(temp_file) == 1 then
          vim.fn.delete(temp_file)
        end

        if err then
          vim.notify("crawl_ls error: " .. err.message, vim.log.levels.ERROR)
          return
        end
        if not result then
          vim.notify("No definition found for URL: " .. url, vim.log.levels.WARN)
          return
        end

        vim.cmd("edit " .. vim.uri_to_fname(result.uri))
      end)
    end, { nargs = 1, desc = "Open a URL with crawl_ls" })
  end,
}

vim.lsp.config("crawl_ls", crawl_ls_config)

vim.lsp.enable({ "crawl_ls" })
