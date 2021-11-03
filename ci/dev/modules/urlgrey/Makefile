REPORTER = spec

lint:
	./node_modules/.bin/jshint ./test ./index.js ./util.js

browser-test:
	$(MAKE) browser-build
	gnome-open test.html

browser-build-min:
	@rm -f urlgrey.min.js
	@./node_modules/.bin/browserify index.js \
		-s urlgrey | \
	./node_modules/.bin/uglifyjs > urlgrey.min.js

browser-build:
	@rm -f urlgrey.js
	@./node_modules/.bin/browserify index.js \
		-s urlgrey > urlgrey.js

precommit:
	$(MAKE) test
	$(MAKE) browser-build
	$(MAKE) browser-build-min
	echo "Artifacts built!"

test:
	$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/mocha --bail --reporter $(REPORTER)

test-cov:
	$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha -- -R spec

test-coveralls:
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	$(MAKE) test
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
	./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && \
		cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js || true

.PHONY: test
