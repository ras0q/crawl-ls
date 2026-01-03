-- NOTE: Set `vim.opt.exrc = true` in your init.lua to use local config files for each project

local cache_dir = vim.fn.stdpath("cache") .. "/crawl_ls"

--- @type vim.lsp.Config
local crawl_ls_config = {
  cmd = { "deno", "task", "dev", "--cache-dir", cache_dir },
  filetypes = { "markdown" },
  single_file_support = true,
}

vim.lsp.config("crawl_ls", crawl_ls_config)

vim.lsp.enable({ "crawl_ls" })

vim.api.nvim_create_user_command("LspCrawlCleanCache", function()
  if vim.fn.isdirectory(cache_dir) == 1 then
    vim.fn.delete(cache_dir, "rf")
    vim.notify("crawl_ls cache deleted: " .. cache_dir, vim.log.levels.INFO)
  else
    vim.notify("crawl_ls cache directory does not exist: " .. cache_dir, vim.log.levels.WARN)
  end
end, { desc = "Delete crawl_ls LSP cache directory" })
