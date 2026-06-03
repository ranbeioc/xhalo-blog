# R2 Asset Convention

Recommended bucket layout:

```text
r2://xhalo-blog-assets/
  uploads/yyyy/mm/dd/<uuid>-<filename>
  posts/<post-slug>/<filename>
  exports/yyyy-mm-dd/<backup>.zip
  imports/<task-id>/
```

Do not migrate historical Git assets to R2 without URL mapping and regression testing.
