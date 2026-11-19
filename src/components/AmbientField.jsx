// The field behind the home page's sections: a faint grid and three slow amber lights.
// Pure CSS (see "ambient field" in index.css): no script, no canvas, no extra download. It is one
// viewport tall and sticks to the screen, so the sections scroll across it and it never grows with the page.
export default function AmbientField() {
  return (
    <div className="ambient-field" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  )
}
